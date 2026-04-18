CREATE TABLE IF NOT EXISTS public.whatsapp_bot_sessions (
  phone text PRIMARY KEY,
  state text NOT NULL DEFAULT 'main_menu',
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_quote_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  requester_name text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  pincode text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  source text NOT NULL DEFAULT 'whatsapp',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  submitted_quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_quote_drafts_phone_idx
ON public.whatsapp_quote_drafts (phone, created_at DESC);

ALTER TABLE public.whatsapp_bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_quote_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage whatsapp bot sessions" ON public.whatsapp_bot_sessions;
CREATE POLICY "Admins can manage whatsapp bot sessions"
ON public.whatsapp_bot_sessions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage whatsapp quote drafts" ON public.whatsapp_quote_drafts;
CREATE POLICY "Admins can manage whatsapp quote drafts"
ON public.whatsapp_quote_drafts
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_whatsapp_bot_sessions_updated_at ON public.whatsapp_bot_sessions;
CREATE TRIGGER update_whatsapp_bot_sessions_updated_at
BEFORE UPDATE ON public.whatsapp_bot_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_quote_drafts_updated_at ON public.whatsapp_quote_drafts;
CREATE TRIGGER update_whatsapp_quote_drafts_updated_at
BEFORE UPDATE ON public.whatsapp_quote_drafts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
