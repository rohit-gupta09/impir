CREATE TABLE IF NOT EXISTS public.whatsapp_outbound_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  draft_id uuid REFERENCES public.whatsapp_quote_drafts(id) ON DELETE SET NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_outbound_messages_status_idx
ON public.whatsapp_outbound_messages (status, created_at);

ALTER TABLE public.whatsapp_outbound_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage whatsapp outbound messages" ON public.whatsapp_outbound_messages;
CREATE POLICY "Admins can manage whatsapp outbound messages"
ON public.whatsapp_outbound_messages
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_whatsapp_outbound_messages_updated_at ON public.whatsapp_outbound_messages;
CREATE TRIGGER update_whatsapp_outbound_messages_updated_at
BEFORE UPDATE ON public.whatsapp_outbound_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
