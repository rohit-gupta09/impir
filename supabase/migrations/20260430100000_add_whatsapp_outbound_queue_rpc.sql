CREATE OR REPLACE FUNCTION public.queue_whatsapp_outbound_message(
  _phone text,
  _message text,
  _draft_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_phone text := regexp_replace(COALESCE(_phone, ''), '\D', '', 'g');
  inserted_id uuid;
BEGIN
  IF clean_phone = '' OR trim(COALESCE(_message, '')) = '' THEN
    RETURN NULL;
  END IF;

  IF length(clean_phone) = 10 THEN
    clean_phone := '91' || clean_phone;
  ELSIF length(clean_phone) = 11 AND left(clean_phone, 1) = '0' THEN
    clean_phone := '91' || right(clean_phone, 10);
  END IF;

  INSERT INTO public.whatsapp_outbound_messages (phone, draft_id, message, status)
  VALUES (clean_phone, _draft_id, trim(_message), 'pending')
  RETURNING id INTO inserted_id;

  RETURN inserted_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.queue_whatsapp_outbound_message(text, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.queue_whatsapp_outbound_message(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_whatsapp_outbound_message(text, text, uuid) TO service_role;
