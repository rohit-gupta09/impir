CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  logo_url text,
  banner_image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view companies" ON public.companies
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert companies" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update companies" ON public.companies
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete companies" ON public.companies
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.promo_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  cta_label text,
  link_type text NOT NULL DEFAULT 'products',
  link_value text,
  position text NOT NULL DEFAULT 'home',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view promo banners" ON public.promo_banners
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert promo banners" ON public.promo_banners
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promo banners" ON public.promo_banners
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promo banners" ON public.promo_banners
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX companies_slug_idx ON public.companies(slug);
CREATE INDEX promo_banners_position_idx ON public.promo_banners(position);
CREATE INDEX promo_banners_display_order_idx ON public.promo_banners(display_order);

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_banners_updated_at
  BEFORE UPDATE ON public.promo_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
