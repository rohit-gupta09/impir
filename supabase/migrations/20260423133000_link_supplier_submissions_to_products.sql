ALTER TABLE public.supplier_product_submissions
ADD COLUMN IF NOT EXISTS created_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS supplier_product_submissions_created_product_id_idx
ON public.supplier_product_submissions (created_product_id);
