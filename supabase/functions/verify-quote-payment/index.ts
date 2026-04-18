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
  product_id?: string;
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
};

const signPayload = async (message: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message),
  );

  return Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
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
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse(500, { error: 'Supabase environment variables are missing' });
    }

    if (!razorpayKeySecret) {
      return jsonResponse(500, { error: 'Razorpay secret is not configured' });
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
    const paymentAttemptId = String(payload.paymentAttemptId || '').trim();
    const razorpayPaymentId = String(payload.razorpay_payment_id || '').trim();
    const razorpayOrderId = String(payload.razorpay_order_id || '').trim();
    const razorpaySignature = String(payload.razorpay_signature || '').trim();

    if (!paymentAttemptId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return jsonResponse(400, { error: 'Payment verification payload is incomplete' });
    }

    const expectedSignature = await signPayload(`${razorpayOrderId}|${razorpayPaymentId}`, razorpayKeySecret);
    if (!timingSafeEqual(expectedSignature, razorpaySignature)) {
      return jsonResponse(400, { error: 'Payment signature verification failed' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: paymentAttempt, error: paymentError } = await supabase
      .from('quote_payment_attempts')
      .select('id, quote_id, user_id, offer_code, original_amount, discount_amount, payable_amount, status, gateway_order_id, metadata, order_id')
      .eq('id', paymentAttemptId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (paymentError || !paymentAttempt) {
      return jsonResponse(404, { error: 'Payment attempt not found' });
    }

    if (paymentAttempt.gateway_order_id !== razorpayOrderId) {
      return jsonResponse(400, { error: 'Gateway order mismatch' });
    }

    if (paymentAttempt.status === 'paid' && paymentAttempt.order_id) {
      return jsonResponse(200, { ok: true, orderId: paymentAttempt.order_id, alreadyVerified: true });
    }

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, user_id, quote_number, products, delivery_address, routing_summary')
      .eq('id', paymentAttempt.quote_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (quoteError || !quote) {
      return jsonResponse(404, { error: 'Quote not found' });
    }

    const offerTitle = String((paymentAttempt.metadata as Record<string, unknown> | null)?.offer_title || '');

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('quote_id', quote.id)
      .maybeSingle();

    let orderId = existingOrder?.id || null;

    if (!orderId) {
      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          quote_id: quote.id,
          quote_number: quote.quote_number,
          products: quote.products as QuoteProduct[],
          total_amount: paymentAttempt.payable_amount,
          subtotal_amount: paymentAttempt.original_amount,
          discount_amount: paymentAttempt.discount_amount,
          payable_amount: paymentAttempt.payable_amount,
          payment_status: 'paid',
          payment_gateway: 'razorpay',
          payment_reference: razorpayPaymentId,
          offer_code: paymentAttempt.offer_code || '',
          offer_title: offerTitle,
          paid_at: new Date().toISOString(),
          delivery_address: quote.delivery_address || {},
          assigned_hub_id: (quote.routing_summary as Record<string, unknown> | null)?.assigned_hub_id || null,
          customer_city: (quote.delivery_address as Record<string, unknown> | null)?.city || '',
          customer_pincode: (quote.delivery_address as Record<string, unknown> | null)?.pincode || '',
          delivery_promise_text: (quote.routing_summary as Record<string, unknown> | null)?.promise_text || '',
          promised_service_level: (quote.routing_summary as Record<string, unknown> | null)?.route_type || '',
          routing_type: (quote.routing_summary as Record<string, unknown> | null)?.route_type || 'central_fallback',
          status: 'Order Confirmed',
        })
        .select('id')
        .single();

      if (orderError || !createdOrder) {
        return jsonResponse(500, { error: 'Failed to create order after payment' });
      }

      orderId = createdOrder.id;

      await supabase.from('quotes').update({ status: 'Accepted' }).eq('id', quote.id);
      await supabase.from('admin_notifications').insert({
        message: `Quote ${quote.quote_number} was paid online and converted to an order.`,
        type: 'payment_received',
        reference_id: quote.id,
      });
      await supabase.from('order_delivery_events').insert({
        order_id: orderId,
        status: 'Order Confirmed',
        updated_by: user.id,
      });
    }

    const { error: updatePaymentError } = await supabase
      .from('quote_payment_attempts')
      .update({
        status: 'paid',
        gateway_payment_id: razorpayPaymentId,
        gateway_signature: razorpaySignature,
        paid_at: new Date().toISOString(),
        order_id: orderId,
      })
      .eq('id', paymentAttempt.id);

    if (updatePaymentError) {
      return jsonResponse(500, { error: 'Failed to finalize payment record' });
    }

    return jsonResponse(200, { ok: true, orderId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonResponse(500, { error: message });
  }
});
