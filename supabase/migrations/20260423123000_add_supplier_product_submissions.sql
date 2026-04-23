CREATE TABLE IF NOT EXISTS public.supplier_product_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  requested_main_category text NOT NULL DEFAULT '',
  requested_subcategory text NOT NULL DEFAULT '',
  product_name text NOT NULL,
  product_description text,
  unit text NOT NULL DEFAULT '',
  proposed_price numeric CHECK (proposed_price >= 0),
  min_order_quantity integer NOT NULL DEFAULT 1 CHECK (min_order_quantity >= 1),
  lead_time_days integer NOT NULL DEFAULT 0 CHECK (lead_time_days >= 0),
  notes text,
  image_url text,
  image_source text NOT NULL DEFAULT 'none',
  status text NOT NULL DEFAULT 'pending',
  admin_review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_product_submissions
DROP CONSTRAINT IF EXISTS supplier_product_submissions_status_check;

ALTER TABLE public.supplier_product_submissions
ADD CONSTRAINT supplier_product_submissions_status_check
CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected'));

ALTER TABLE public.supplier_product_submissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS supplier_product_submissions_supplier_id_idx
ON public.supplier_product_submissions (supplier_id, created_at DESC);

CREATE INDEX IF NOT EXISTS supplier_product_submissions_status_idx
ON public.supplier_product_submissions (status, created_at DESC);

CREATE POLICY "Admins can view supplier product submissions"
ON public.supplier_product_submissions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update supplier product submissions"
ON public.supplier_product_submissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers can view own product submissions"
ON public.supplier_product_submissions FOR SELECT TO authenticated
USING (public.user_owns_supplier(auth.uid(), supplier_id));

CREATE POLICY "Suppliers can insert own product submissions"
ON public.supplier_product_submissions FOR INSERT TO authenticated
WITH CHECK (public.user_owns_supplier(auth.uid(), supplier_id));

CREATE POLICY "Suppliers can update own pending product submissions"
ON public.supplier_product_submissions FOR UPDATE TO authenticated
USING (
  public.user_owns_supplier(auth.uid(), supplier_id)
  AND status = 'pending'
)
WITH CHECK (
  public.user_owns_supplier(auth.uid(), supplier_id)
);

CREATE TRIGGER update_supplier_product_submissions_updated_at
  BEFORE UPDATE ON public.supplier_product_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-product-images', 'supplier-product-images', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

CREATE POLICY "Authenticated users can view supplier product images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'supplier-product-images');

CREATE POLICY "Suppliers can upload own product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'supplier-product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Suppliers can update own product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'supplier-product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'supplier-product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Suppliers can delete own product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'supplier-product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can manage supplier product images"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'supplier-product-images'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'supplier-product-images'
  AND public.has_role(auth.uid(), 'admin')
); 
