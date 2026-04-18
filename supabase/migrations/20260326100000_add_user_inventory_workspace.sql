CREATE TABLE IF NOT EXISTS public.user_inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit text NOT NULL DEFAULT 'units',
  reorder_level numeric NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_inventory_items_user_id_idx
  ON public.user_inventory_items (user_id);

CREATE INDEX IF NOT EXISTS user_inventory_items_product_id_idx
  ON public.user_inventory_items (product_id);

ALTER TABLE public.user_inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory items"
ON public.user_inventory_items FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory items"
ON public.user_inventory_items FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory items"
ON public.user_inventory_items FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory items"
ON public.user_inventory_items FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_user_inventory_items_updated_at
BEFORE UPDATE ON public.user_inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
