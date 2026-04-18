ALTER TABLE public.products
ADD COLUMN company_name text;

UPDATE public.products
SET company_name = 'General'
WHERE company_name IS NULL OR trim(company_name) = '';

ALTER TABLE public.products
ALTER COLUMN company_name SET DEFAULT 'General';

ALTER TABLE public.products
ALTER COLUMN company_name SET NOT NULL;

CREATE INDEX products_company_name_idx
  ON public.products(company_name);
