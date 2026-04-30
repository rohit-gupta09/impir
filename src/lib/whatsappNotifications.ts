import { supabase } from '@/integrations/supabase/client';

const adminWhatsappPhone = import.meta.env.VITE_ADMIN_WHATSAPP_PHONE as string | undefined;

type QuoteWhatsappPayload = {
  quoteNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  companyName?: string | null;
  itemCount?: number;
  projectType?: string | null;
  status?: string | null;
  adminResponse?: string | null;
  quoteTotal?: number | null;
};

type SignupWhatsappPayload = {
  fullName: string;
  phone?: string;
  companyName?: string;
  accountType?: string;
};

const formatINR = (value?: number | null) => {
  if (!value) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(value);
};

const queueWhatsappMessage = async (phone: string | null | undefined, message: string) => {
  if (!phone?.trim() || !message.trim()) return;

  const { error } = await (supabase as any).rpc('queue_whatsapp_outbound_message', {
    _phone: phone,
    _message: message,
    _draft_id: null,
  });

  if (error) throw error;
};

const queueAll = async (messages: Array<{ phone?: string | null; message: string }>) => {
  const results = await Promise.allSettled(messages.map((item) => queueWhatsappMessage(item.phone, item.message)));
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error('WhatsApp notification queue failed', result.reason);
    }
  });
};

export const queueSignupWhatsapp = async (payload: SignupWhatsappPayload) => {
  const customerMessage = [
    `Hi ${payload.fullName || 'there'}, your account has been created.`,
    'Please confirm your email to activate your account.',
  ].join('\n');

  const adminMessage = [
    'New account created.',
    `Name: ${payload.fullName || '-'}`,
    `Phone: ${payload.phone || '-'}`,
    `Company: ${payload.companyName || '-'}`,
    `Type: ${payload.accountType || 'User'}`,
  ].join('\n');

  await queueAll([
    { phone: payload.phone, message: customerMessage },
    { phone: adminWhatsappPhone, message: adminMessage },
  ]);
};

export const queueQuoteSubmittedWhatsapp = async (payload: QuoteWhatsappPayload) => {
  const customerMessage = [
    `Your quote ${payload.quoteNumber} has been submitted.`,
    `Items: ${payload.itemCount || 0}`,
    'We will review it and reply with pricing details.',
  ].join('\n');

  const adminMessage = [
    `New quote submitted: ${payload.quoteNumber}`,
    `Customer: ${payload.customerName || '-'}`,
    `Phone: ${payload.customerPhone || '-'}`,
    `Company: ${payload.companyName || '-'}`,
    `Items: ${payload.itemCount || 0}`,
    `Project: ${payload.projectType || '-'}`,
  ].join('\n');

  await queueAll([
    { phone: payload.customerPhone, message: customerMessage },
    { phone: adminWhatsappPhone, message: adminMessage },
  ]);
};

export const queueQuoteRespondedWhatsapp = async (payload: QuoteWhatsappPayload) => {
  const total = formatINR(payload.quoteTotal);
  const message = [
    `Your quote ${payload.quoteNumber} has been updated.`,
    `Status: ${payload.status || 'Responded'}`,
    total ? `Total: ${total}` : '',
    payload.adminResponse ? `Admin response: ${payload.adminResponse}` : 'Please check your account for pricing details.',
  ]
    .filter(Boolean)
    .join('\n');

  await queueAll([{ phone: payload.customerPhone, message }]);
};

export const queueOrderPlacedWhatsapp = async (payload: QuoteWhatsappPayload) => {
  const total = formatINR(payload.quoteTotal);
  const customerMessage = [
    `Order confirmed for quote ${payload.quoteNumber}.`,
    total ? `Amount: ${total}` : '',
    'We will share delivery updates here.',
  ]
    .filter(Boolean)
    .join('\n');

  const adminMessage = [
    `Order placed for quote ${payload.quoteNumber}.`,
    `Customer: ${payload.customerName || '-'}`,
    `Phone: ${payload.customerPhone || '-'}`,
    total ? `Amount: ${total}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  await queueAll([
    { phone: payload.customerPhone, message: customerMessage },
    { phone: adminWhatsappPhone, message: adminMessage },
  ]);
};
