ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supplier';

ALTER TABLE public.franchise_partner_applications
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS address_line1 text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS pincode text,
ADD COLUMN IF NOT EXISTS review_notes text,
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS franchise_partner_applications_user_id_idx
ON public.franchise_partner_applications (user_id);

ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_application_id uuid REFERENCES public.franchise_partner_applications(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS address_line1 text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS pincode text;

CREATE UNIQUE INDEX IF NOT EXISTS suppliers_user_id_unique_idx
ON public.suppliers (user_id)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS suppliers_city_pincode_idx
ON public.suppliers (lower(city), pincode);

CREATE OR REPLACE FUNCTION public.user_owns_supplier(_user_id uuid, _supplier_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.suppliers
    WHERE id = _supplier_id
      AND user_id = _user_id
  )
$$;

DROP POLICY IF EXISTS "Admins can view suppliers" ON public.suppliers;
CREATE POLICY "Admins can view suppliers" ON public.suppliers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers can view own supplier profile" ON public.suppliers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert suppliers" ON public.suppliers;
CREATE POLICY "Admins can insert suppliers" ON public.suppliers
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update suppliers" ON public.suppliers;
CREATE POLICY "Admins can update suppliers" ON public.suppliers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete suppliers" ON public.suppliers;
CREATE POLICY "Admins can delete suppliers" ON public.suppliers
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view supplier product prices" ON public.supplier_product_prices;
CREATE POLICY "Admins can view supplier product prices" ON public.supplier_product_prices
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers can view own product prices" ON public.supplier_product_prices
  FOR SELECT TO authenticated
  USING (public.user_owns_supplier(auth.uid(), supplier_id));

DROP POLICY IF EXISTS "Admins can insert supplier product prices" ON public.supplier_product_prices;
CREATE POLICY "Admins can insert supplier product prices" ON public.supplier_product_prices
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers can insert own product prices" ON public.supplier_product_prices
  FOR INSERT TO authenticated
  WITH CHECK (public.user_owns_supplier(auth.uid(), supplier_id));

DROP POLICY IF EXISTS "Admins can update supplier product prices" ON public.supplier_product_prices;
CREATE POLICY "Admins can update supplier product prices" ON public.supplier_product_prices
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers can update own product prices" ON public.supplier_product_prices
  FOR UPDATE TO authenticated
  USING (public.user_owns_supplier(auth.uid(), supplier_id))
  WITH CHECK (public.user_owns_supplier(auth.uid(), supplier_id));

DROP POLICY IF EXISTS "Admins can delete supplier product prices" ON public.supplier_product_prices;
CREATE POLICY "Admins can delete supplier product prices" ON public.supplier_product_prices
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers can delete own product prices" ON public.supplier_product_prices
  FOR DELETE TO authenticated
  USING (public.user_owns_supplier(auth.uid(), supplier_id));
