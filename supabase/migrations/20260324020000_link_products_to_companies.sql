ALTER TABLE public.products
ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

UPDATE public.products p
SET company_id = c.id
FROM public.companies c
WHERE lower(trim(p.company_name)) = lower(trim(c.name))
  AND p.company_id IS NULL;

CREATE INDEX products_company_id_idx
  ON public.products(company_id);
