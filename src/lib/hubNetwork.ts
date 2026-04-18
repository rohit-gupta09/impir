import { supabase } from '@/integrations/supabase/client';

export type SessionLocation = {
  city: string;
  pincode: string;
};

export type HubRecord = {
  id: string;
  city_name: string;
  state: string;
  pincode_range: string;
  hub_manager_name: string;
  hub_manager_phone: string;
  hub_manager_user_id?: string | null;
  is_active: boolean;
  is_central?: boolean;
  delivery_radius_km: number;
  same_day_cutoff_time: string;
  created_at: string;
};

export type RoutingItem = {
  product_id: string;
  quantity: number;
  name?: string;
};

export type RoutingResult = {
  matchedHub: HubRecord | null;
  assignedHub: HubRecord | null;
  centralHub: HubRecord | null;
  isServiceable: boolean;
  stockAvailableAtLocalHub: boolean;
  sameDayEligible: boolean;
  routeType: 'same_day' | 'next_day_local' | 'next_day_central' | 'two_day_central' | 'not_serviceable';
  promiseText: string;
  summaryText: string;
  reason: string;
};

const SESSION_LOCATION_KEY = 'impir.customer.location';

const normalizeText = (value: string) => value.trim().toLowerCase();

export const normalizePincode = (value: string) => value.replace(/\D/g, '').slice(0, 6);

export const isValidPincode = (value: string) => /^\d{6}$/.test(normalizePincode(value));

export const getSessionLocation = (): SessionLocation => {
  if (typeof window === 'undefined') {
    return { city: '', pincode: '' };
  }

  const raw = window.sessionStorage.getItem(SESSION_LOCATION_KEY);
  if (!raw) {
    return { city: '', pincode: '' };
  }

  try {
    const parsed = JSON.parse(raw) as SessionLocation;
    return {
      city: parsed.city || '',
      pincode: normalizePincode(parsed.pincode || ''),
    };
  } catch {
    return { city: '', pincode: '' };
  }
};

export const saveSessionLocation = (location: SessionLocation) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(
    SESSION_LOCATION_KEY,
    JSON.stringify({
      city: location.city.trim(),
      pincode: normalizePincode(location.pincode),
    }),
  );
};

const parseRangePart = (value: string) => {
  const [startRaw, endRaw] = value.split('-').map((item) => normalizePincode(item));
  const start = Number(startRaw);
  const end = Number(endRaw || startRaw);

  if (!startRaw || Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }

  return {
    start: Math.min(start, end),
    end: Math.max(start, end),
  };
};

export const pincodeInHubRange = (pincode: string, range: string) => {
  const normalized = normalizePincode(pincode);
  if (!normalized || !range) {
    return false;
  }

  const numericPincode = Number(normalized);
  return range
    .split(',')
    .map((part) => parseRangePart(part.trim()))
    .some((part) => !!part && numericPincode >= part.start && numericPincode <= part.end);
};

const parseCutoffMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 14 * 60;
  }

  return hours * 60 + minutes;
};

const currentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

export const formatCutoffLabel = (value: string) => {
  const [hoursText, minutesText] = value.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText ?? '0');
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return '2pm';
  }

  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: minutes === 0 ? undefined : '2-digit',
  }).format(new Date(2026, 0, 1, hours, minutes));
};

export const fetchActiveHubs = async () => {
  const { data, error } = await (supabase as any)
    .from('hubs')
    .select('*')
    .eq('is_active', true)
    .order('is_central', { ascending: false })
    .order('city_name');

  if (error) {
    throw error;
  }

  return (data || []) as HubRecord[];
};

export const saveCustomerLocation = async (userId: string | null, location: SessionLocation) => {
  const cleanLocation = {
    city: location.city.trim(),
    pincode: normalizePincode(location.pincode),
  };

  saveSessionLocation(cleanLocation);

  if (!userId || !cleanLocation.city || !cleanLocation.pincode) {
    return;
  }

  await (supabase as any)
    .from('profiles')
    .update({
      preferred_city: cleanLocation.city,
      preferred_pincode: cleanLocation.pincode,
    })
    .eq('user_id', userId);
};

const getMatchingHub = (hubs: HubRecord[], city: string, pincode: string) => {
  const normalizedCity = normalizeText(city);

  return (
    hubs.find((hub) => normalizedCity && normalizeText(hub.city_name) === normalizedCity) ||
    hubs.find((hub) => pincodeInHubRange(pincode, hub.pincode_range)) ||
    null
  );
};

const canCentralHubServe = (pincode: string) => normalizePincode(pincode).startsWith('30');

export const resolveRoutingFromData = (
  location: SessionLocation,
  hubs: HubRecord[],
  inventoryRows: Array<{ hub_id: string; product_id: string; quantity_available: number }> = [],
  items: RoutingItem[] = [],
): RoutingResult => {
  const matchedHub = getMatchingHub(hubs, location.city, location.pincode);
  const centralHub =
    hubs.find((hub) => hub.is_central) ||
    hubs.find((hub) => normalizeText(hub.city_name) === 'alwar') ||
    null;

  if (!location.city && !location.pincode) {
    return {
      matchedHub,
      assignedHub: null,
      centralHub,
      isServiceable: false,
      stockAvailableAtLocalHub: false,
      sameDayEligible: false,
      routeType: 'not_serviceable',
      promiseText: 'Enter your city or pincode to see the delivery promise.',
      summaryText: 'Delivery promise unavailable until location is set.',
      reason: 'missing_location',
    };
  }

  const stockAvailableAtLocalHub = matchedHub
    ? items.every((item) => {
        const inventory = inventoryRows.find(
          (row) => row.hub_id === matchedHub.id && row.product_id === item.product_id,
        );
        return (inventory?.quantity_available || 0) >= item.quantity;
      })
    : false;

  const sameDayEligible =
    !!matchedHub &&
    stockAvailableAtLocalHub &&
    currentMinutes() <= parseCutoffMinutes(matchedHub.same_day_cutoff_time);

  if (sameDayEligible && matchedHub) {
    const cutoffLabel = formatCutoffLabel(matchedHub.same_day_cutoff_time);
    return {
      matchedHub,
      assignedHub: matchedHub,
      centralHub,
      isServiceable: true,
      stockAvailableAtLocalHub,
      sameDayEligible,
      routeType: 'same_day',
      promiseText: `Order before ${cutoffLabel} -> Same day delivery in ${matchedHub.city_name}`,
      summaryText: `This order will be packed at ${matchedHub.city_name} hub and delivered the same day.`,
      reason: 'local_stock_available',
    };
  }

  if (matchedHub && stockAvailableAtLocalHub) {
    return {
      matchedHub,
      assignedHub: matchedHub,
      centralHub,
      isServiceable: true,
      stockAvailableAtLocalHub,
      sameDayEligible: false,
      routeType: 'next_day_local',
      promiseText: `Next day delivery from ${matchedHub.city_name}`,
      summaryText: `The local hub in ${matchedHub.city_name} has stock, but today's same-day cutoff has passed.`,
      reason: 'cutoff_passed',
    };
  }

  if (centralHub && (matchedHub || canCentralHubServe(location.pincode))) {
    const routeType = matchedHub ? 'next_day_central' : 'two_day_central';
    const promiseText =
      routeType === 'next_day_central'
        ? `Next day delivery from ${centralHub.city_name}`
        : `2-day delivery from ${centralHub.city_name}`;

    return {
      matchedHub,
      assignedHub: centralHub,
      centralHub,
      isServiceable: true,
      stockAvailableAtLocalHub: false,
      sameDayEligible: false,
      routeType,
      promiseText,
      summaryText: matchedHub
        ? `The local hub is out of stock for one or more items, so this order will route through ${centralHub.city_name}.`
        : `Your pincode is covered by the central ${centralHub.city_name} hub.`,
      reason: matchedHub ? 'local_stock_unavailable' : 'central_coverage',
    };
  }

  return {
    matchedHub,
    assignedHub: null,
    centralHub,
    isServiceable: false,
    stockAvailableAtLocalHub: false,
    sameDayEligible: false,
    routeType: 'not_serviceable',
    promiseText: 'Not serviceable yet - notify me',
    summaryText: 'This location is currently outside the active hub network.',
    reason: 'outside_network',
  };
};

export const resolveRoutingForItems = async (location: SessionLocation, items: RoutingItem[]) => {
  const hubs = await fetchActiveHubs();
  const productIds = [...new Set(items.map((item) => item.product_id).filter(Boolean))];

  let inventoryRows: Array<{ hub_id: string; product_id: string; quantity_available: number }> = [];
  if (productIds.length > 0) {
    const { data, error } = await (supabase as any)
      .from('hub_inventory')
      .select('hub_id, product_id, quantity_available')
      .in('product_id', productIds);

    if (error) {
      throw error;
    }

    inventoryRows = data || [];
  }

  return resolveRoutingFromData(location, hubs, inventoryRows, items);
};

export const queueNotifyMeRequest = async (input: {
  userId?: string | null;
  productId?: string | null;
  city?: string;
  pincode: string;
  phone?: string;
}) => {
  return (supabase as any).from('serviceability_notify_requests').insert({
    user_id: input.userId || null,
    product_id: input.productId || null,
    city: input.city || '',
    pincode: normalizePincode(input.pincode),
    phone: input.phone || '',
  });
};
