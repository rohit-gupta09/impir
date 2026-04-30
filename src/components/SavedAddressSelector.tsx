import { useEffect, useState } from 'react';
import { Crosshair, MapPin, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export type QuoteAddress = {
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
};

type SavedAddress = {
  id: string;
  label: string | null;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean | null;
};

type Props = {
  userId: string | null;
  value: QuoteAddress;
  onChange: (address: QuoteAddress) => void;
  saveAddress: boolean;
  onSaveAddressChange: (save: boolean) => void;
  addressLabel: string;
  onAddressLabelChange: (label: string) => void;
};

const normalizePincode = (value: string) => value.replace(/\D/g, '').slice(0, 6);

export const saveQuoteAddress = async (userId: string, address: QuoteAddress, label: string) => {
  const cleanAddress = {
    addressLine1: address.addressLine1.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    pincode: normalizePincode(address.pincode),
  };

  if (!cleanAddress.addressLine1 || !cleanAddress.city || !cleanAddress.state || cleanAddress.pincode.length !== 6) {
    return;
  }

  const { data: existing } = await supabase
    .from('saved_addresses')
    .select('id')
    .eq('user_id', userId)
    .eq('address_line1', cleanAddress.addressLine1)
    .eq('city', cleanAddress.city)
    .eq('state', cleanAddress.state)
    .eq('pincode', cleanAddress.pincode)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from('saved_addresses')
      .update({ label: label.trim() || 'Saved address' })
      .eq('id', existing.id);
    return;
  }

  await supabase.from('saved_addresses').insert({
    user_id: userId,
    label: label.trim() || 'Saved address',
    address_line1: cleanAddress.addressLine1,
    city: cleanAddress.city,
    state: cleanAddress.state,
    pincode: cleanAddress.pincode,
    is_default: false,
  });
};

export default function SavedAddressSelector({
  userId,
  value,
  onChange,
  saveAddress,
  onSaveAddressChange,
  addressLabel,
  onAddressLabelChange,
}: Props) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!userId) {
      setAddresses([]);
      return;
    }

    supabase
      .from('saved_addresses')
      .select('id, label, address_line1, city, state, pincode, is_default')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => setAddresses((data || []) as SavedAddress[]));
  }, [userId]);

  const applySavedAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = addresses.find((item) => item.id === addressId);
    if (!address) return;

    onChange({
      addressLine1: address.address_line1,
      city: address.city,
      state: address.state,
      pincode: normalizePincode(address.pincode),
    });
    onAddressLabelChange(address.label || 'Saved address');
  };

  const useNewAddress = () => {
    setSelectedAddressId('');
    onChange({ addressLine1: '', city: '', state: '', pincode: '' });
    onAddressLabelChange('Site address');
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Current location is not available in this browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          );
          const result = await response.json();
          const address = result.address || {};
          const city = address.city || address.town || address.village || address.county || '';
          const state = address.state || '';
          const pincode = normalizePincode(address.postcode || '');
          const lineParts = [address.house_number, address.road, address.suburb || address.neighbourhood]
            .filter(Boolean)
            .join(', ');

          onChange({
            addressLine1: lineParts || `Current location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            city,
            state,
            pincode,
          });
          onAddressLabelChange('Current location');
          setSelectedAddressId('');
          toast.success('Current location added. Please check the address before submitting.');
        } catch {
          toast.error('Could not convert current location to an address');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error('Location permission was denied');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-end">
        <div className="space-y-1">
          <Label>Saved address</Label>
          <Select value={selectedAddressId} onValueChange={applySavedAddress} disabled={!userId || addresses.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={addresses.length > 0 ? 'Use a saved address' : 'No saved addresses yet'} />
            </SelectTrigger>
            <SelectContent>
              {addresses.map((address) => (
                <SelectItem key={address.id} value={address.id}>
                  {(address.label || 'Saved address')} - {address.city}, {address.pincode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="outline" onClick={useCurrentLocation} disabled={locating}>
          <Crosshair className="mr-2 h-4 w-4" />
          {locating ? 'Locating' : 'Current location'}
        </Button>
        <Button type="button" variant="outline" onClick={useNewAddress}>
          <Plus className="mr-2 h-4 w-4" />
          New
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-md bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={saveAddress} onCheckedChange={(checked) => onSaveAddressChange(checked === true)} />
          Save this address for next time
        </label>
        {saveAddress && (
          <div className="flex items-center gap-2 sm:w-72">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Input value={addressLabel} onChange={(event) => onAddressLabelChange(event.target.value)} placeholder="Label, e.g. Site A" />
          </div>
        )}
      </div>

      {value.city || value.pincode ? (
        <p className="text-xs text-muted-foreground">
          Selected delivery area: {[value.city, value.state].filter(Boolean).join(', ')}
          {value.pincode ? ` - ${value.pincode}` : ''}
        </p>
      ) : null}
    </div>
  );
}
