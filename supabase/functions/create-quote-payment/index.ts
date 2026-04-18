import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type QuoteProduct = {
  name?: string;
  sku?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  total_price?: number;
};

type OfferRow = {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const roundCurrency = (value: number) => Math.max(0, Math.round(value * 100) / 100);

const getQuoteSubtotal = (products: QuoteProduct[]) =>
  roundCurrency(
    products.reduce((sum, product) => {
      const totalPrice = Number(product.total_price || 0);
      if (totalPrice > 0) {
        return sum + totalPrice;
      }

      return sum + Number(product.unit_price || 0) * Number(product.quantity || 0);
    }, 0),
  );

const computeDiscount = (subtotal: number, offer: OfferRow | null) => {
  if (!offer) {
    return 0;
  }

  if (subtotal < Number(offer.min_order_amount || 0)) {
    return 0;
  }

  let discount =
    offer.discount_type === 'percent'
      ? subtotal * (Number(offer.discount_value || 0) / 100)
      : Number(offer.discount_value || 0);

  if (offer.max_discount_amount) {
    discount = Math.min(discount, Number(offer.max_discount_amount));
  }

  return roundCurrency(Math.min(discount, subtotal));
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse(500, { error: 'Supabase environment variables are missing' });
    }

    if (!razorpayKeyId || !razorpayKeySecret) {
      return jsonResponse(500, { error: 'Razorpay credentials are not configured' });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') ?? '',
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    const payload = await request.json();
    const quoteId = String(payload.quoteId || '').trim();
    const offerCode = String(payload.offerCode || '').trim().toUpperCase();

    if (!quoteId) {
      return jsonResponse(400, { error: 'quoteId is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, user_id, quote_number, status, products')
      .eq('id', quoteId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (quoteError || !quote) {
      return jsonResponse(404, { error: 'Quote not found' });
    }

    if (quote.status !== 'Responded') {
      return jsonResponse(400, { error: 'This quote is not ready for payment' });
    }

    const products = Array.isArray(quote.products) ? (quote.products as QuoteProduct[]) : [];
    const subtotal = getQuoteSubtotal(products);

    if (subtotal <= 0) {
      return jsonResponse(400, { error: 'Quote does not contain payable pricing yet' });
    }

    let appliedOffer: OfferRow | null = null;
    if (offerCode) {
      const { data: offer, error: offerError } = await supabase
        .from('quote_checkout_offers')
        .select('id, code, title, description, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, ends_at')
        .eq('code', offerCode)
        .eq('is_active', true)
        .maybeSingle();

      if (offerError || !offer) {
        return jsonResponse(400, { error: 'Offer code is invalid or inactive' });
      }

      appliedOffer = offer as OfferRow;
      const now = Date.now();
      if (appliedOffer.starts_at && new Date(appliedOffer.starts_at).getTime() > now) {
        return jsonResponse(400, { error: 'Offer is not active yet' });
      }
      if (appliedOffer.ends_at && new Date(appliedOffer.ends_at).getTime() < now) {
        return jsonResponse(400, { error: 'Offer has expired' });
      }
      if (subtotal < Number(appliedOffer.min_order_amount || 0)) {
        return jsonResponse(400, { error: `Offer is available only for orders above ₹${Number(appliedOffer.min_order_amount).toLocaleString('en-IN')}` });
      }
    }

    const discountAmount = computeDiscount(subtotal, appliedOffer);
    const payableAmount = roundCurrency(subtotal - discountAmount);

    const razorpayOrderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(payableAmount * 100),
        currency: 'INR',
        receipt: quote.quote_number,
        notes: {
          quote_id: quote.id,
          quote_number: quote.quote_number,
          user_id: user.id,
          offer_code: appliedOffer?.code || '',
        },
      }),
    });

    if (!razorpayOrderResponse.ok) {
      const details = await razorpayOrderResponse.text();
      return jsonResponse(500, { error: 'Failed to create gateway order', details });
    }

    const gatewayOrder = await razorpayOrderResponse.json();

    const { data: paymentAttempt, error: paymentError } = await supabase
      .from('quote_payment_attempts')
      .insert({
        quote_id: quote.id,
        user_id: user.id,
        offer_id: appliedOffer?.id || null,
        offer_code: appliedOffer?.code || '',
        gateway: 'razorpay',
        gateway_order_id: gatewayOrder.id,
        original_amount: subtotal,
        discount_amount: discountAmount,
        payable_amount: payableAmount,
        currency: 'INR',
        status: 'created',
        metadata: {
          quote_number: quote.quote_number,
          offer_title: appliedOffer?.title || '',
        },
      })
      .select('id')
      .single();

    if (paymentError || !paymentAttempt) {
      return jsonResponse(500, { error: 'Failed to save payment attempt' });
    }

    return jsonResponse(200, {
      ok: true,
      keyId: razorpayKeyId,
      paymentAttemptId: paymentAttempt.id,
      gatewayOrderId: gatewayOrder.id,
      quoteNumber: quote.quote_number,
      pricing: {
        subtotal,
        discountAmount,
        payableAmount,
        currency: 'INR',
      },
      appliedOffer: appliedOffer
        ? {
            code: appliedOffer.code,
            title: appliedOffer.title,
            description: appliedOffer.description,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonResponse(500, { error: message });
  }
});
