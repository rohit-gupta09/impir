CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT suppliers_name_key UNIQUE (name)
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view suppliers" ON public.suppliers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert suppliers" ON public.suppliers
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update suppliers" ON public.suppliers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete suppliers" ON public.suppliers
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.supplier_product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  location_name text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  min_order_quantity integer NOT NULL DEFAULT 1 CHECK (min_order_quantity >= 1),
  lead_time_days integer NOT NULL DEFAULT 0 CHECK (lead_time_days >= 0),
  notes text,
  is_preferred boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supplier_product_prices_unique UNIQUE (supplier_id, product_id, location_name)
);

ALTER TABLE public.supplier_product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view supplier product prices" ON public.supplier_product_prices
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert supplier product prices" ON public.supplier_product_prices
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update supplier product prices" ON public.supplier_product_prices
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete supplier product prices" ON public.supplier_product_prices
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX supplier_product_prices_product_id_idx
  ON public.supplier_product_prices(product_id);

CREATE INDEX supplier_product_prices_supplier_id_idx
  ON public.supplier_product_prices(supplier_id);

CREATE INDEX supplier_product_prices_location_name_idx
  ON public.supplier_product_prices(location_name);

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_product_prices_updated_at
  BEFORE UPDATE ON public.supplier_product_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
