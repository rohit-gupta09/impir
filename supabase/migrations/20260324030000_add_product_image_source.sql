ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_source text NOT NULL DEFAULT 'none';
