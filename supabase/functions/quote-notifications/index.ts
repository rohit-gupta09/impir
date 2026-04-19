import { createClient } from '@supabase/supabase-js';
import { sendQuoteNotification } from '../_shared/quoteNotifications.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

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

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse(500, { error: 'Supabase environment variables are missing' });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') ?? '',
        },
      },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    const payload = await request.json();
    const eventType = String(payload.eventType || '').trim() as 'quote_submitted' | 'order_placed' | 'quote_responded';
    const quoteId = String(payload.quoteId || '').trim();
    const orderId = payload.orderId ? String(payload.orderId).trim() : null;

    if (!eventType || !quoteId) {
      return jsonResponse(400, { error: 'eventType and quoteId are required' });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: quote } = await serviceClient
      .from('quotes')
      .select('id, user_id')
      .eq('id', quoteId)
      .maybeSingle();

    if (!quote) {
      return jsonResponse(404, { error: 'Quote not found' });
    }

    if (eventType === 'quote_responded') {
      const { data: isAdmin, error: adminError } = await authClient.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      if (adminError || !isAdmin) {
        return jsonResponse(403, { error: 'Only admins can send quote response notifications' });
      }
    } else if (quote.user_id !== user.id) {
      return jsonResponse(403, { error: 'You can only trigger notifications for your own records' });
    }

    const result = await sendQuoteNotification({
      config: {
        supabaseUrl,
        supabaseServiceRoleKey,
        resendApiKey: Deno.env.get('RESEND_API_KEY') ?? '',
        fromEmail: Deno.env.get('NOTIFICATION_FROM_EMAIL') || Deno.env.get('CONTACT_FROM_EMAIL') || 'Romart Notifications <onboarding@resend.dev>',
        supportEmail: Deno.env.get('SUPPORT_NOTIFICATION_EMAIL') || Deno.env.get('CONTACT_TO_EMAIL') || 'supportromart@gmail.com',
      },
      eventType,
      quoteId,
      orderId,
    });

    return jsonResponse(200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonResponse(500, { error: message });
  }
});
