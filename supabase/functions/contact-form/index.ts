import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
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
    const payload = (await request.json()) as ContactPayload;
    const name = payload.name?.trim() || '';
    const email = payload.email?.trim() || '';
    const subject = payload.subject?.trim() || '';
    const message = payload.message?.trim() || '';

    if (!name || !email || !subject || !message) {
      return jsonResponse(400, { error: 'All fields are required' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
    const fromEmail = Deno.env.get('CONTACT_FROM_EMAIL') || 'Romart Contact <onboarding@resend.dev>';
    const toEmail = Deno.env.get('CONTACT_TO_EMAIL') || 'supportromart@gmail.com';

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(500, { error: 'Supabase environment variables are missing' });
    }

    if (!resendApiKey) {
      return jsonResponse(500, { error: 'RESEND_API_KEY is not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') ?? '',
        },
      },
    });

    const { error: insertError } = await supabase.from('contact_messages').insert({
      name,
      email,
      subject,
      message,
    });

    if (insertError) {
      return jsonResponse(500, { error: 'Failed to save contact message' });
    }

    const mailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `New contact form message: ${subject}`,
        text: [
          'A new contact form message was submitted.',
          '',
          `Name: ${name}`,
          `Email: ${email}`,
          `Subject: ${subject}`,
          '',
          'Message:',
          message,
        ].join('\n'),
      }),
    });

    if (!mailResponse.ok) {
      const errorText = await mailResponse.text();
      return jsonResponse(500, {
        error: 'Message was saved but email delivery failed',
        details: errorText,
      });
    }

    return jsonResponse(200, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonResponse(500, { error: message });
  }
});
