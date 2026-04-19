import { createClient, SupabaseClient } from '@supabase/supabase-js';

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type QuoteRow = {
  id: string;
  user_id: string;
  quote_number: string;
  business_name: string | null;
  requested_by_name: string | null;
  requested_by_email: string | null;
  requested_by_phone: string | null;
  contact_method: string | null;
  project_type: string;
  project_description: string | null;
  payment_terms: string | null;
  status: string;
  admin_response: string | null;
  products: Json;
  delivery_address: Json | null;
  created_at: string;
};

type OrderRow = {
  id: string;
  quote_id: string;
  quote_number: string;
  total_amount: number | null;
  payable_amount?: number | null;
  status: string;
  created_at: string;
};

type ProfileRow = {
  full_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  whatsapp_opt_in: boolean | null;
};

type QuoteProduct = {
  name?: string;
  sku?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  total_price?: number;
};

type NotificationEvent = 'quote_submitted' | 'order_placed' | 'quote_responded';

type NotificationConfig = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  resendApiKey?: string;
  supportEmail?: string;
  fromEmail?: string;
};

type SendNotificationArgs = {
  config: NotificationConfig;
  eventType: NotificationEvent;
  quoteId: string;
  orderId?: string | null;
};

type SendNotificationResult = {
  ok: boolean;
  sentEmails: string[];
  queuedWhatsapp: boolean;
  warnings: string[];
};

const defaultResult = (): SendNotificationResult => ({
  ok: true,
  sentEmails: [],
  queuedWhatsapp: false,
  warnings: [],
});

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

const getDeliveryText = (deliveryAddress: Json | null) => {
  if (!deliveryAddress || typeof deliveryAddress !== 'object' || Array.isArray(deliveryAddress)) {
    return '-';
  }

  const address = deliveryAddress as Record<string, Json | undefined>;
  return [
    String(address.address_line1 || address.line1 || '').trim(),
    String(address.city || '').trim(),
    String(address.state || '').trim(),
    String(address.pincode || '').trim(),
  ]
    .filter(Boolean)
    .join(', ');
};

const getProducts = (products: Json): QuoteProduct[] =>
  Array.isArray(products) ? (products as QuoteProduct[]) : [];

const getProductSummary = (products: Json) => {
  const lines = getProducts(products).slice(0, 10).map((product, index) => {
    const quantity = Number(product.quantity || 0);
    const unit = String(product.unit || '').trim();
    const name = String(product.name || 'Unnamed product').trim();
    const sku = String(product.sku || '').trim();
    const unitPrice = Number(product.unit_price || 0);
    const totalPrice = Number(product.total_price || 0);

    return [
      `${index + 1}. ${name}`,
      sku ? `SKU: ${sku}` : null,
      quantity ? `Qty: ${quantity}${unit ? ` ${unit}` : ''}` : null,
      unitPrice > 0 ? `Unit Price: ${formatCurrency(unitPrice)}` : null,
      totalPrice > 0 ? `Line Total: ${formatCurrency(totalPrice)}` : null,
    ]
      .filter(Boolean)
      .join(' | ');
  });

  return lines.length > 0 ? lines.join('\n') : 'No product lines found';
};

const createServiceClient = (config: NotificationConfig) =>
  createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const sendEmail = async ({
  resendApiKey,
  fromEmail,
  to,
  replyTo,
  subject,
  text,
}: {
  resendApiKey?: string;
  fromEmail: string;
  to: string[];
  replyTo?: string | null;
  subject: string;
  text: string;
}) => {
  if (!resendApiKey) {
    return { ok: false, warning: 'RESEND_API_KEY is not configured' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      reply_to: replyTo || undefined,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    return { ok: false, warning: await response.text() };
  }

  return { ok: true };
};

const queueWhatsapp = async (supabase: SupabaseClient, phone: string, message: string) => {
  const normalizedPhone = phone.trim();
  if (!normalizedPhone) return false;

  const { error } = await supabase.from('whatsapp_outbound_messages').insert({
    phone: normalizedPhone,
    message,
    status: 'pending',
  });

  return !error;
};

const fetchQuoteContext = async (supabase: SupabaseClient, quoteId: string) => {
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('id, user_id, quote_number, business_name, requested_by_name, requested_by_email, requested_by_phone, contact_method, project_type, project_description, payment_terms, status, admin_response, products, delivery_address, created_at')
    .eq('id', quoteId)
    .single();

  if (quoteError || !quote) {
    throw new Error('Quote not found');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, company_name, whatsapp_opt_in')
    .eq('user_id', quote.user_id)
    .maybeSingle();

  return {
    quote: quote as QuoteRow,
    profile: (profile || null) as ProfileRow | null,
  };
};

export async function sendQuoteNotification({
  config,
  eventType,
  quoteId,
  orderId,
}: SendNotificationArgs): Promise<SendNotificationResult> {
  const result = defaultResult();
  const supabase = createServiceClient(config);
  const { quote, profile } = await fetchQuoteContext(supabase, quoteId);
  const fromEmail = config.fromEmail || 'Romart Notifications <onboarding@resend.dev>';
  const supportEmail = config.supportEmail || 'supportromart@gmail.com';
  const recipientEmail = quote.requested_by_email || profile?.email || null;
  const recipientPhone = quote.requested_by_phone || profile?.phone || null;
  const recipientName = quote.requested_by_name || profile?.full_name || 'Customer';
  const companyName = quote.business_name || profile?.company_name || '-';
  const deliveryText = getDeliveryText(quote.delivery_address);
  const productSummary = getProductSummary(quote.products);

  if (eventType === 'quote_submitted') {
    const emailResult = await sendEmail({
      resendApiKey: config.resendApiKey,
      fromEmail,
      to: [supportEmail],
      replyTo: recipientEmail,
      subject: `New quote request ${quote.quote_number}`,
      text: [
        'A new quote request has been submitted.',
        '',
        `Quote Number: ${quote.quote_number}`,
        `Submitted At: ${quote.created_at}`,
        `Customer: ${recipientName}`,
        `Company: ${companyName}`,
        `Email: ${recipientEmail || '-'}`,
        `Phone: ${recipientPhone || '-'}`,
        `Preferred Contact: ${quote.contact_method || '-'}`,
        `Project Type: ${quote.project_type || '-'}`,
        `Delivery Address: ${deliveryText}`,
        '',
        'Requested Items:',
        productSummary,
        '',
        'Notes:',
        quote.project_description || '-',
      ].join('\n'),
    });

    if (emailResult.ok) {
      result.sentEmails.push(supportEmail);
    } else {
      result.warnings.push(emailResult.warning);
    }

    return result;
  }

  if (eventType === 'order_placed') {
    let order: OrderRow | null = null;
    if (orderId) {
      const { data } = await supabase
        .from('orders')
        .select('id, quote_id, quote_number, total_amount, status, created_at')
        .eq('id', orderId)
        .maybeSingle();
      order = (data || null) as OrderRow | null;
    } else {
      const { data } = await supabase
        .from('orders')
        .select('id, quote_id, quote_number, total_amount, status, created_at')
        .eq('quote_id', quote.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      order = (data || null) as OrderRow | null;
    }

    const emailResult = await sendEmail({
      resendApiKey: config.resendApiKey,
      fromEmail,
      to: [supportEmail],
      replyTo: recipientEmail,
      subject: `Order placed for ${quote.quote_number}`,
      text: [
        'A customer placed an order.',
        '',
        `Quote Number: ${quote.quote_number}`,
        `Order ID: ${order?.id || '-'}`,
        `Order Status: ${order?.status || '-'}`,
        `Order Total: ${typeof order?.total_amount === 'number' ? formatCurrency(order.total_amount) : '-'}`,
        `Customer: ${recipientName}`,
        `Company: ${companyName}`,
        `Email: ${recipientEmail || '-'}`,
        `Phone: ${recipientPhone || '-'}`,
        `Delivery Address: ${deliveryText}`,
        '',
        'Ordered Items:',
        productSummary,
      ].join('\n'),
    });

    if (emailResult.ok) {
      result.sentEmails.push(supportEmail);
    } else {
      result.warnings.push(emailResult.warning);
    }

    return result;
  }

  if (recipientEmail) {
    const emailResult = await sendEmail({
      resendApiKey: config.resendApiKey,
      fromEmail,
      to: [recipientEmail],
      subject: `Your quote ${quote.quote_number} has been updated`,
      text: [
        `Hello ${recipientName},`,
        '',
        `Your quote ${quote.quote_number} has been responded to by the Romart team.`,
        `Status: ${quote.status}`,
        `Payment Terms: ${quote.payment_terms || 'To Be Confirmed'}`,
        '',
        'Admin Response:',
        quote.admin_response || 'Your pricing and response are now available in your account.',
        '',
        'Quote Items:',
        productSummary,
        '',
        'Please log in to your account to review the quote.',
      ].join('\n'),
    });

    if (emailResult.ok) {
      result.sentEmails.push(recipientEmail);
    } else {
      result.warnings.push(emailResult.warning);
    }
  } else {
    result.warnings.push('No customer email available for quote response notification');
  }

  const shouldQueueWhatsapp =
    !!recipientPhone &&
    (quote.contact_method === 'WhatsApp' || quote.contact_method === 'Phone' || profile?.whatsapp_opt_in === true);

  if (shouldQueueWhatsapp && recipientPhone) {
    result.queuedWhatsapp = await queueWhatsapp(
      supabase,
      recipientPhone,
      [
        `Romart update for quote ${quote.quote_number}.`,
        `Status: ${quote.status}.`,
        quote.admin_response || 'Your quote has been responded to. Please check your account for details.',
      ].join(' '),
    );

    if (!result.queuedWhatsapp) {
      result.warnings.push('Failed to queue WhatsApp notification');
    }
  }

  return result;
}
