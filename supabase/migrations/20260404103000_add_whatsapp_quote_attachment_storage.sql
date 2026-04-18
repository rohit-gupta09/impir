INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp-quote-attachments', 'whatsapp-quote-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can view whatsapp quote attachments"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'whatsapp-quote-attachments'
  AND public.has_role(auth.uid(), 'admin')
);
