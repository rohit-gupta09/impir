ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS designation text DEFAULT '',
ADD COLUMN IF NOT EXISTS business_account_id uuid;

CREATE TABLE IF NOT EXISTS public.business_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  display_name text NOT NULL,
  gstin text DEFAULT '',
  contact_email text DEFAULT '',
  contact_phone text DEFAULT '',
  billing_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_terms text NOT NULL DEFAULT 'Advance',
  credit_limit numeric NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
  customer_type text NOT NULL DEFAULT 'standard',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_business_account_id_fkey
FOREIGN KEY (business_account_id) REFERENCES public.business_accounts(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS business_accounts_gstin_key
ON public.business_accounts ((upper(nullif(trim(gstin), ''))))
WHERE nullif(trim(gstin), '') IS NOT NULL;

CREATE INDEX IF NOT EXISTS business_accounts_display_name_idx
ON public.business_accounts (lower(display_name));

CREATE TABLE IF NOT EXISTS public.business_account_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id uuid NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'buyer' CHECK (role IN ('owner', 'admin', 'buyer', 'approver', 'site_manager')),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_account_id, user_id)
);

CREATE INDEX IF NOT EXISTS business_account_memberships_user_id_idx
ON public.business_account_memberships (user_id);

ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS business_account_id uuid REFERENCES public.business_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS business_name text DEFAULT '',
ADD COLUMN IF NOT EXISTS requested_by_name text DEFAULT '',
ADD COLUMN IF NOT EXISTS requested_by_email text DEFAULT '',
ADD COLUMN IF NOT EXISTS requested_by_phone text DEFAULT '',
ADD COLUMN IF NOT EXISTS billing_address jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT 'To Be Confirmed';

CREATE INDEX IF NOT EXISTS quotes_business_account_id_idx
ON public.quotes (business_account_id);

CREATE TABLE IF NOT EXISTS public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  sku text DEFAULT '',
  quantity numeric NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit text NOT NULL DEFAULT 'per piece',
  notes text DEFAULT '',
  source text NOT NULL DEFAULT 'catalog_match',
  unit_price numeric NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  tax_percent numeric NOT NULL DEFAULT 18 CHECK (tax_percent >= 0),
  line_total numeric NOT NULL DEFAULT 0 CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quote_id, line_number)
);

CREATE INDEX IF NOT EXISTS quote_items_quote_id_idx
ON public.quote_items (quote_id);

CREATE TABLE IF NOT EXISTS public.quote_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  source text NOT NULL DEFAULT 'system',
  reason text NOT NULL DEFAULT 'snapshot',
  status text NOT NULL DEFAULT 'Pending',
  admin_response text DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  freight_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_terms text NOT NULL DEFAULT 'To Be Confirmed',
  validity_days integer NOT NULL DEFAULT 7 CHECK (validity_days >= 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quote_id, version_number)
);

CREATE INDEX IF NOT EXISTS quote_versions_quote_id_idx
ON public.quote_versions (quote_id);

ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_account_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_versions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.user_belongs_to_business_account(_user_id uuid, _business_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_account_memberships bam
    WHERE bam.user_id = _user_id
      AND bam.business_account_id = _business_account_id
  )
$$;

CREATE OR REPLACE FUNCTION public.user_can_manage_business_account(_user_id uuid, _business_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_account_memberships bam
    WHERE bam.user_id = _user_id
      AND bam.business_account_id = _business_account_id
      AND bam.role IN ('owner', 'admin')
  )
$$;

CREATE POLICY "Business members can view their business accounts"
ON public.business_accounts FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.user_belongs_to_business_account(auth.uid(), id)
);

CREATE POLICY "Authenticated users can create business accounts"
ON public.business_accounts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Business owners and admins can update business accounts"
ON public.business_accounts FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.user_can_manage_business_account(auth.uid(), id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.user_can_manage_business_account(auth.uid(), id)
);

CREATE POLICY "Users can view their business memberships"
ON public.business_account_memberships FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR user_id = auth.uid()
  OR public.user_can_manage_business_account(auth.uid(), business_account_id)
);

CREATE POLICY "Users can create their own business memberships"
ON public.business_account_memberships FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR user_id = auth.uid()
);

CREATE POLICY "Business owners and admins can update memberships"
ON public.business_account_memberships FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.user_can_manage_business_account(auth.uid(), business_account_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.user_can_manage_business_account(auth.uid(), business_account_id)
);

CREATE POLICY "Admins and quote owners can view quote items"
ON public.quote_items FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.quotes q
    WHERE q.id = quote_id
      AND (q.user_id = auth.uid() OR public.user_belongs_to_business_account(auth.uid(), q.business_account_id))
  )
);

CREATE POLICY "Admins can manage quote items"
ON public.quote_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and quote owners can view quote versions"
ON public.quote_versions FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.quotes q
    WHERE q.id = quote_id
      AND (q.user_id = auth.uid() OR public.user_belongs_to_business_account(auth.uid(), q.business_account_id))
  )
);

CREATE POLICY "Admins can manage quote versions"
ON public.quote_versions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.ensure_business_account(
  _display_name text,
  _legal_name text DEFAULT '',
  _gstin text DEFAULT '',
  _contact_email text DEFAULT '',
  _contact_phone text DEFAULT '',
  _created_by uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_display_name text := nullif(trim(_display_name), '');
  normalized_legal_name text := COALESCE(nullif(trim(_legal_name), ''), nullif(trim(_display_name), ''), 'Business Account');
  normalized_gstin text := upper(COALESCE(nullif(trim(_gstin), ''), ''));
  existing_business_account_id uuid;
  created_business_account_id uuid;
BEGIN
  IF normalized_display_name IS NULL THEN
    RETURN NULL;
  END IF;

  IF normalized_gstin <> '' THEN
    SELECT id
    INTO existing_business_account_id
    FROM public.business_accounts
    WHERE upper(nullif(trim(gstin), '')) = normalized_gstin
    LIMIT 1;
  END IF;

  IF existing_business_account_id IS NULL THEN
    SELECT id
    INTO existing_business_account_id
    FROM public.business_accounts
    WHERE lower(display_name) = lower(normalized_display_name)
    LIMIT 1;
  END IF;

  IF existing_business_account_id IS NULL THEN
    INSERT INTO public.business_accounts (
      legal_name,
      display_name,
      gstin,
      contact_email,
      contact_phone,
      created_by
    )
    VALUES (
      normalized_legal_name,
      normalized_display_name,
      normalized_gstin,
      COALESCE(_contact_email, ''),
      COALESCE(_contact_phone, ''),
      _created_by
    )
    RETURNING id INTO created_business_account_id;

    existing_business_account_id := created_business_account_id;
  ELSE
    UPDATE public.business_accounts
    SET
      legal_name = COALESCE(nullif(legal_name, ''), normalized_legal_name),
      display_name = COALESCE(nullif(display_name, ''), normalized_display_name),
      gstin = CASE
        WHEN nullif(trim(gstin), '') IS NULL AND normalized_gstin <> '' THEN normalized_gstin
        ELSE gstin
      END,
      contact_email = CASE
        WHEN nullif(trim(contact_email), '') IS NULL AND nullif(trim(_contact_email), '') IS NOT NULL THEN trim(_contact_email)
        ELSE contact_email
      END,
      contact_phone = CASE
        WHEN nullif(trim(contact_phone), '') IS NULL AND nullif(trim(_contact_phone), '') IS NOT NULL THEN trim(_contact_phone)
        ELSE contact_phone
      END,
      updated_at = now()
    WHERE id = existing_business_account_id;
  END IF;

  IF _created_by IS NOT NULL THEN
    INSERT INTO public.business_account_memberships (business_account_id, user_id, role, is_primary)
    VALUES (existing_business_account_id, _created_by, 'owner', true)
    ON CONFLICT (business_account_id, user_id)
    DO UPDATE SET
      is_primary = true;
  END IF;

  RETURN existing_business_account_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_quote_items_from_products()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.quote_items WHERE quote_id = NEW.id;

  INSERT INTO public.quote_items (
    quote_id,
    line_number,
    product_id,
    name,
    sku,
    quantity,
    unit,
    notes,
    source,
    unit_price,
    tax_percent,
    line_total
  )
  SELECT
    NEW.id,
    item.ordinality::integer,
    NULLIF(item.value->>'product_id', '')::uuid,
    COALESCE(item.value->>'name', 'Item ' || item.ordinality::text),
    COALESCE(item.value->>'sku', ''),
    COALESCE(NULLIF(item.value->>'quantity', '')::numeric, 1),
    COALESCE(NULLIF(item.value->>'unit', ''), 'per piece'),
    COALESCE(item.value->>'notes', ''),
    COALESCE(NULLIF(item.value->>'source', ''), 'catalog_match'),
    COALESCE(NULLIF(item.value->>'unit_price', '')::numeric, 0),
    COALESCE(NULLIF(item.value->>'tax_percent', '')::numeric, 18),
    COALESCE(
      NULLIF(item.value->>'total_price', '')::numeric,
      COALESCE(NULLIF(item.value->>'unit_price', '')::numeric, 0) * COALESCE(NULLIF(item.value->>'quantity', '')::numeric, 1)
    )
  FROM jsonb_array_elements(COALESCE(NEW.products, '[]'::jsonb)) WITH ORDINALITY AS item(value, ordinality);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_quote_version_from_quote(
  _quote_id uuid,
  _created_by uuid DEFAULT auth.uid(),
  _source text DEFAULT 'system',
  _reason text DEFAULT 'snapshot'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_quote public.quotes%ROWTYPE;
  next_version integer;
  subtotal_amount numeric := 0;
  version_id uuid;
BEGIN
  SELECT *
  INTO current_quote
  FROM public.quotes
  WHERE id = _quote_id;

  IF current_quote.id IS NULL THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM public.quote_versions
  WHERE quote_id = _quote_id;

  SELECT COALESCE(SUM(line_total), 0)
  INTO subtotal_amount
  FROM public.quote_items
  WHERE quote_id = _quote_id;

  INSERT INTO public.quote_versions (
    quote_id,
    version_number,
    source,
    reason,
    status,
    admin_response,
    items,
    subtotal,
    total_amount,
    payment_terms,
    created_by
  )
  VALUES (
    _quote_id,
    next_version,
    COALESCE(NULLIF(_source, ''), 'system'),
    COALESCE(NULLIF(_reason, ''), 'snapshot'),
    current_quote.status,
    COALESCE(current_quote.admin_response, ''),
    COALESCE(current_quote.products, '[]'::jsonb),
    subtotal_amount,
    subtotal_amount,
    COALESCE(current_quote.payment_terms, 'To Be Confirmed'),
    _created_by
  )
  RETURNING id INTO version_id;

  RETURN version_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_initial_quote_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_quote_version_from_quote(NEW.id, NEW.user_id, 'customer', 'initial_request');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  business_account_uuid uuid;
BEGIN
  business_account_uuid := public.ensure_business_account(
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'gstin', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.id
  );

  INSERT INTO public.profiles (user_id, full_name, phone, company_name, email, designation, business_account_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'designation', ''),
    business_account_uuid
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    company_name = EXCLUDED.company_name,
    email = EXCLUDED.email,
    designation = EXCLUDED.designation,
    business_account_id = COALESCE(public.profiles.business_account_id, EXCLUDED.business_account_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_business_accounts_updated_at
BEFORE UPDATE ON public.business_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quote_items_updated_at
BEFORE UPDATE ON public.quote_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS sync_quote_items_from_products ON public.quotes;
CREATE TRIGGER sync_quote_items_from_products
AFTER INSERT OR UPDATE OF products ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.sync_quote_items_from_products();

DROP TRIGGER IF EXISTS create_initial_quote_version ON public.quotes;
CREATE TRIGGER create_initial_quote_version
AFTER INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.create_initial_quote_version();

UPDATE public.profiles p
SET business_account_id = public.ensure_business_account(
  COALESCE(p.company_name, ''),
  COALESCE(p.company_name, ''),
  '',
  COALESCE(p.email, ''),
  COALESCE(p.phone, ''),
  p.user_id
)
WHERE COALESCE(p.company_name, '') <> ''
  AND p.business_account_id IS NULL;

UPDATE public.quotes q
SET
  business_account_id = COALESCE(q.business_account_id, p.business_account_id),
  business_name = CASE
    WHEN COALESCE(q.business_name, '') = '' THEN COALESCE(p.company_name, '')
    ELSE q.business_name
  END,
  requested_by_name = CASE
    WHEN COALESCE(q.requested_by_name, '') = '' THEN COALESCE(p.full_name, '')
    ELSE q.requested_by_name
  END,
  requested_by_email = CASE
    WHEN COALESCE(q.requested_by_email, '') = '' THEN COALESCE(p.email, '')
    ELSE q.requested_by_email
  END,
  requested_by_phone = CASE
    WHEN COALESCE(q.requested_by_phone, '') = '' THEN COALESCE(p.phone, '')
    ELSE q.requested_by_phone
  END
FROM public.profiles p
WHERE p.user_id = q.user_id;

INSERT INTO public.quote_versions (
  quote_id,
  version_number,
  source,
  reason,
  status,
  admin_response,
  items,
  subtotal,
  total_amount,
  payment_terms,
  created_by,
  created_at
)
SELECT
  q.id,
  1,
  'system',
  'backfill',
  q.status,
  COALESCE(q.admin_response, ''),
  q.products,
  COALESCE((
    SELECT SUM(
      COALESCE(NULLIF(item.value->>'total_price', '')::numeric,
      COALESCE(NULLIF(item.value->>'unit_price', '')::numeric, 0) * COALESCE(NULLIF(item.value->>'quantity', '')::numeric, 1))
    )
    FROM jsonb_array_elements(COALESCE(q.products, '[]'::jsonb)) AS item(value)
  ), 0),
  COALESCE((
    SELECT SUM(
      COALESCE(NULLIF(item.value->>'total_price', '')::numeric,
      COALESCE(NULLIF(item.value->>'unit_price', '')::numeric, 0) * COALESCE(NULLIF(item.value->>'quantity', '')::numeric, 1))
    )
    FROM jsonb_array_elements(COALESCE(q.products, '[]'::jsonb)) AS item(value)
  ), 0),
  COALESCE(q.payment_terms, 'To Be Confirmed'),
  q.user_id,
  q.created_at
FROM public.quotes q
WHERE NOT EXISTS (
  SELECT 1
  FROM public.quote_versions v
  WHERE v.quote_id = q.id
);
