ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hub_manager';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_city text DEFAULT '',
ADD COLUMN IF NOT EXISTS preferred_pincode text DEFAULT '',
ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT true;

ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS routing_summary jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS assigned_hub_id uuid,
ADD COLUMN IF NOT EXISTS customer_city text DEFAULT '',
ADD COLUMN IF NOT EXISTS customer_pincode text DEFAULT '',
ADD COLUMN IF NOT EXISTS delivery_promise_text text DEFAULT '',
ADD COLUMN IF NOT EXISTS promised_service_level text DEFAULT '',
ADD COLUMN IF NOT EXISTS routing_type text DEFAULT 'central_fallback';

CREATE TABLE IF NOT EXISTS public.hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  state text NOT NULL,
  pincode_range text NOT NULL DEFAULT '',
  hub_manager_name text NOT NULL DEFAULT '',
  hub_manager_phone text NOT NULL DEFAULT '',
  hub_manager_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_central boolean NOT NULL DEFAULT false,
  delivery_radius_km numeric NOT NULL DEFAULT 20,
  same_day_cutoff_time time NOT NULL DEFAULT '14:00',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders
ADD CONSTRAINT orders_assigned_hub_id_fkey
FOREIGN KEY (assigned_hub_id) REFERENCES public.hubs(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.hub_inventory (
  hub_id uuid NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_available integer NOT NULL DEFAULT 0,
  reorder_level integer NOT NULL DEFAULT 10,
  last_updated timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (hub_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.inventory_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_hub_id uuid NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
  to_hub_id uuid NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  notes text DEFAULT '',
  initiated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('Order Confirmed', 'Packed at Hub', 'Out for Delivery', 'Delivered')),
  note text DEFAULT '',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_dispatch_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  recipient_phone text NOT NULL DEFAULT '',
  message text NOT NULL,
  event_type text NOT NULL DEFAULT 'delivery_update',
  status text NOT NULL DEFAULT 'pending',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.serviceability_notify_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  city text NOT NULL DEFAULT '',
  pincode text NOT NULL,
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.franchise_partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  current_business_type text NOT NULL,
  has_shop_or_godown boolean NOT NULL DEFAULT false,
  monthly_hardware_purchases text NOT NULL,
  phone_number text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hubs_city_name_idx ON public.hubs (lower(city_name));
CREATE INDEX IF NOT EXISTS hubs_is_active_idx ON public.hubs (is_active);
CREATE INDEX IF NOT EXISTS hub_inventory_product_id_idx ON public.hub_inventory (product_id);
CREATE INDEX IF NOT EXISTS orders_assigned_hub_id_idx ON public.orders (assigned_hub_id);
CREATE INDEX IF NOT EXISTS order_delivery_events_order_id_idx ON public.order_delivery_events (order_id);
CREATE INDEX IF NOT EXISTS serviceability_notify_requests_pincode_idx ON public.serviceability_notify_requests (pincode);
CREATE INDEX IF NOT EXISTS franchise_partner_applications_city_idx ON public.franchise_partner_applications (lower(city));

ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_dispatch_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serviceability_notify_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_partner_applications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.user_manages_hub(_user_id uuid, _hub_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hubs
    WHERE id = _hub_id
      AND hub_manager_user_id = _user_id
  )
$$;

CREATE POLICY "Authenticated can view active hubs"
ON public.hubs FOR SELECT TO authenticated
USING (is_active OR public.has_role(auth.uid(), 'admin') OR hub_manager_user_id = auth.uid());

CREATE POLICY "Admins can manage hubs"
ON public.hubs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and hub managers can view hub inventory"
ON public.hub_inventory FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.user_manages_hub(auth.uid(), hub_id)
);

CREATE POLICY "Admins can manage hub inventory"
ON public.hub_inventory FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and hub managers can view transfers"
ON public.inventory_transfers FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.user_manages_hub(auth.uid(), from_hub_id)
  OR public.user_manages_hub(auth.uid(), to_hub_id)
);

CREATE POLICY "Admins can insert transfers"
ON public.inventory_transfers FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and assigned hub managers can view delivery events"
ON public.order_delivery_events FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_id
      AND o.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_id
      AND public.user_manages_hub(auth.uid(), o.assigned_hub_id)
  )
);

CREATE POLICY "Admins and assigned hub managers can insert delivery events"
ON public.order_delivery_events FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_id
      AND public.user_manages_hub(auth.uid(), o.assigned_hub_id)
  )
);

CREATE POLICY "Admins can view WhatsApp queue"
ON public.whatsapp_dispatch_queue FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage WhatsApp queue"
ON public.whatsapp_dispatch_queue FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can insert notify requests"
ON public.serviceability_notify_requests FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view notify requests"
ON public.serviceability_notify_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can submit franchise applications"
ON public.franchise_partner_applications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can review franchise applications"
ON public.franchise_partner_applications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update franchise applications"
ON public.franchise_partner_applications FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.user_manages_hub(auth.uid(), assigned_hub_id)
);

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins and assigned hub managers can update orders"
ON public.orders FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.user_manages_hub(auth.uid(), assigned_hub_id)
);

CREATE OR REPLACE FUNCTION public.sync_order_status_from_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET status = NEW.status,
      updated_at = now()
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_whatsapp_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
  v_order_number text;
BEGIN
  SELECT p.phone, o.quote_number
  INTO v_phone, v_order_number
  FROM public.orders o
  JOIN public.profiles p ON p.user_id = o.user_id
  WHERE o.id = NEW.order_id;

  INSERT INTO public.whatsapp_dispatch_queue (order_id, recipient_phone, message, payload)
  VALUES (
    NEW.order_id,
    COALESCE(v_phone, ''),
    'Order ' || COALESCE(v_order_number, '') || ' update: ' || NEW.status,
    jsonb_build_object('status', NEW.status, 'note', NEW.note)
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_partner_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (message, type)
  VALUES (
    'New SupplyWala partner application from ' || NEW.name || ' in ' || NEW.city || '. Call ' || NEW.phone_number || '.',
    'partner_application'
  );

  INSERT INTO public.whatsapp_dispatch_queue (recipient_phone, message, event_type, payload)
  VALUES (
    '',
    'New partner application from ' || NEW.name || ' in ' || NEW.city || '. Phone: ' || NEW.phone_number || '.',
    'partner_application',
    jsonb_build_object(
      'name', NEW.name,
      'city', NEW.city,
      'phone_number', NEW.phone_number,
      'current_business_type', NEW.current_business_type
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_order_status_from_event ON public.order_delivery_events;
CREATE TRIGGER sync_order_status_from_event
AFTER INSERT ON public.order_delivery_events
FOR EACH ROW
EXECUTE FUNCTION public.sync_order_status_from_event();

DROP TRIGGER IF EXISTS enqueue_whatsapp_update ON public.order_delivery_events;
CREATE TRIGGER enqueue_whatsapp_update
AFTER INSERT ON public.order_delivery_events
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_whatsapp_update();

DROP TRIGGER IF EXISTS notify_partner_application ON public.franchise_partner_applications;
CREATE TRIGGER notify_partner_application
AFTER INSERT ON public.franchise_partner_applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_partner_application();

CREATE OR REPLACE FUNCTION public.transfer_hub_inventory(
  _from_hub_id uuid,
  _to_hub_id uuid,
  _product_id uuid,
  _quantity integer,
  _notes text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  from_qty integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can transfer hub inventory';
  END IF;

  SELECT quantity_available
  INTO from_qty
  FROM public.hub_inventory
  WHERE hub_id = _from_hub_id
    AND product_id = _product_id
  FOR UPDATE;

  IF from_qty IS NULL OR from_qty < _quantity THEN
    RAISE EXCEPTION 'Insufficient inventory at source hub';
  END IF;

  UPDATE public.hub_inventory
  SET quantity_available = quantity_available - _quantity,
      last_updated = now()
  WHERE hub_id = _from_hub_id
    AND product_id = _product_id;

  INSERT INTO public.hub_inventory (hub_id, product_id, quantity_available, last_updated)
  VALUES (_to_hub_id, _product_id, _quantity, now())
  ON CONFLICT (hub_id, product_id)
  DO UPDATE SET
    quantity_available = public.hub_inventory.quantity_available + EXCLUDED.quantity_available,
    last_updated = now();

  INSERT INTO public.inventory_transfers (from_hub_id, to_hub_id, product_id, quantity, notes, initiated_by)
  VALUES (_from_hub_id, _to_hub_id, _product_id, _quantity, COALESCE(_notes, ''), auth.uid());
END;
$$;

INSERT INTO public.hubs (
  city_name,
  state,
  pincode_range,
  hub_manager_name,
  hub_manager_phone,
  is_active,
  is_central,
  delivery_radius_km,
  same_day_cutoff_time
)
SELECT
  'Alwar',
  'Rajasthan',
  '301001-301030,301101-301199',
  'Central Ops',
  '',
  true,
  true,
  60,
  '17:00'
WHERE NOT EXISTS (
  SELECT 1 FROM public.hubs WHERE lower(city_name) = 'alwar'
);
