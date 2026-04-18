ALTER TABLE public.user_inventory_items
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS procurement_requested boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS procurement_status text NOT NULL DEFAULT 'not_requested',
ADD COLUMN IF NOT EXISTS procurement_requested_at timestamptz,
ADD COLUMN IF NOT EXISTS admin_procurement_notes text NOT NULL DEFAULT '';

UPDATE public.user_inventory_items
SET procurement_status = CASE
  WHEN procurement_requested THEN 'pending'
  ELSE 'not_requested'
END
WHERE procurement_status IS NULL
   OR procurement_status NOT IN ('not_requested', 'pending', 'reviewed', 'quoted', 'completed');

ALTER TABLE public.user_inventory_items
DROP CONSTRAINT IF EXISTS user_inventory_items_procurement_status_check;

ALTER TABLE public.user_inventory_items
ADD CONSTRAINT user_inventory_items_procurement_status_check
CHECK (procurement_status IN ('not_requested', 'pending', 'reviewed', 'quoted', 'completed'));

CREATE INDEX IF NOT EXISTS user_inventory_items_procurement_requested_idx
  ON public.user_inventory_items (procurement_requested);

CREATE INDEX IF NOT EXISTS user_inventory_items_procurement_status_idx
  ON public.user_inventory_items (procurement_status);

CREATE POLICY "Admins can view all inventory items"
ON public.user_inventory_items FOR SELECT TO authenticated
USING (public.has_role('admin', auth.uid()));

CREATE POLICY "Admins can update all inventory items"
ON public.user_inventory_items FOR UPDATE TO authenticated
USING (public.has_role('admin', auth.uid()))
WITH CHECK (public.has_role('admin', auth.uid()));

INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory-images', 'inventory-images', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

CREATE POLICY "Authenticated users can view inventory images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'inventory-images');

CREATE POLICY "Users can upload own inventory images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'inventory-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own inventory images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'inventory-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'inventory-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own inventory images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'inventory-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can manage inventory images"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'inventory-images'
  AND public.has_role('admin', auth.uid())
)
WITH CHECK (
  bucket_id = 'inventory-images'
  AND public.has_role('admin', auth.uid())
);
