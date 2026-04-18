ALTER TABLE public.franchise_partner_applications
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
ADD COLUMN IF NOT EXISTS approved_supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS franchise_partner_applications_status_idx
ON public.franchise_partner_applications (status, created_at DESC);