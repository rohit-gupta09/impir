DROP POLICY IF EXISTS "Admins can update quotes" ON public.quotes;
CREATE POLICY "Admins can update quotes"
  ON public.quotes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all quotes" ON public.quotes;
CREATE POLICY "Admins can view all quotes"
  ON public.quotes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
