CREATE TABLE IF NOT EXISTS public.quote_checkout_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL CHECK (discount_type IN ('flat', 'percent')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount_amount numeric CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.quote_checkout_offers(id) ON DELETE SET NULL,
  offer_code text NOT NULL DEFAULT '',
  gateway text NOT NULL DEFAULT 'razorpay',
  gateway_order_id text NOT NULL UNIQUE,
  gateway_payment_id text,
  gateway_signature text,
  original_amount numeric NOT NULL CHECK (original_amount >= 0),
  discount_amount numeric NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  payable_amount numeric NOT NULL CHECK (payable_amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS subtotal_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payable_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_gateway text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS payment_reference text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS offer_code text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS offer_title text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS paid_at timestamptz;

UPDATE public.orders
SET subtotal_amount = total_amount,
    payable_amount = total_amount
WHERE subtotal_amount = 0
  AND payable_amount = 0;

CREATE INDEX IF NOT EXISTS quote_checkout_offers_active_idx
  ON public.quote_checkout_offers (is_active);

CREATE INDEX IF NOT EXISTS quote_payment_attempts_quote_id_idx
  ON public.quote_payment_attempts (quote_id);

CREATE INDEX IF NOT EXISTS quote_payment_attempts_user_id_idx
  ON public.quote_payment_attempts (user_id);

ALTER TABLE public.quote_checkout_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_payment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active checkout offers"
ON public.quote_checkout_offers FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage checkout offers"
ON public.quote_checkout_offers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own payment attempts"
ON public.quote_payment_attempts FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own payment attempts"
ON public.quote_payment_attempts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own payment attempts"
ON public.quote_payment_attempts FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_quote_checkout_offers_updated_at
BEFORE UPDATE ON public.quote_checkout_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quote_payment_attempts_updated_at
BEFORE UPDATE ON public.quote_payment_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.quote_checkout_offers (
  code,
  title,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_discount_amount,
  is_active
)
SELECT
  'SAVE500',
  'Flat ₹500 Off',
  'Get ₹500 off on quote orders above ₹25,000.',
  'flat',
  500,
  25000,
  NULL,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.quote_checkout_offers WHERE code = 'SAVE500'
);

INSERT INTO public.quote_checkout_offers (
  code,
  title,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_discount_amount,
  is_active
)
SELECT
  'BULK10',
  '10% Bulk Discount',
  'Save 10% on quote orders above ₹50,000 up to ₹5,000.',
  'percent',
  10,
  50000,
  5000,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.quote_checkout_offers WHERE code = 'BULK10'
);
