CREATE POLICY "Anon can view categories"
ON public.categories
FOR SELECT TO anon
USING (true);

CREATE POLICY "Anon can view companies"
ON public.companies
FOR SELECT TO anon
USING (true);

CREATE POLICY "Anon can view promo banners"
ON public.promo_banners
FOR SELECT TO anon
USING (true);

CREATE POLICY "Anon can view catalog main categories"
ON public.catalog_main_categories
FOR SELECT TO anon
USING (true);

CREATE POLICY "Anon can view catalog subcategories"
ON public.catalog_subcategories
FOR SELECT TO anon
USING (true);

CREATE POLICY "Anon can view active hubs"
ON public.hubs
FOR SELECT TO anon
USING (is_active = true);

CREATE POLICY "Anon can view hub inventory"
ON public.hub_inventory
FOR SELECT TO anon
USING (true);
