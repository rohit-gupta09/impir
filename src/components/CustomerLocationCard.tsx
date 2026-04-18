import { useEffect, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getSessionLocation,
  isValidPincode,
  normalizePincode,
  resolveRoutingForItems,
  saveCustomerLocation,
  type RoutingItem,
  type RoutingResult,
} from '@/lib/hubNetwork';

type Props = {
  items?: RoutingItem[];
  title?: string;
  description?: string;
  compact?: boolean;
  onResolved?: (result: RoutingResult, location: { city: string; pincode: string }) => void;
};

export function CustomerLocationCard({
  items = [],
  title = 'Set Your Delivery City',
  description = 'Tell us your city and pincode so we can deliver your products to the right location.',
  compact = false,
  onResolved,
}: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [city, setCity] = useState(profile?.preferred_city || getSessionLocation().city);
  const [pincode, setPincode] = useState(profile?.preferred_pincode || getSessionLocation().pincode);
  const [routing, setRouting] = useState<RoutingResult | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCity(profile?.preferred_city || getSessionLocation().city);
    setPincode(profile?.preferred_pincode || getSessionLocation().pincode);
  }, [profile?.preferred_city, profile?.preferred_pincode]);

  useEffect(() => {
    const cleanPincode = normalizePincode(pincode);
    if (!city.trim() && !isValidPincode(cleanPincode)) {
      return;
    }

    resolveRoutingForItems({ city, pincode: cleanPincode }, items)
      .then((result) => {
        setRouting(result);
        onResolved?.(result, { city: city.trim(), pincode: cleanPincode });
      })
      .catch(() => {
        setRouting(null);
      });
  }, [city, pincode, JSON.stringify(items), onResolved]);

  const handleSave = async () => {
    const cleanPincode = normalizePincode(pincode);
    if (!city.trim() || !isValidPincode(cleanPincode)) {
      toast.error('Enter a valid city and 6-digit pincode');
      return;
    }

    setSaving(true);
    await saveCustomerLocation(user?.id || null, { city, pincode: cleanPincode });
    if (user) {
      await refreshProfile();
    }
    const result = await resolveRoutingForItems({ city, pincode: cleanPincode }, items);
    setRouting(result);
    onResolved?.(result, { city: city.trim(), pincode: cleanPincode });
    setSaving(false);
    toast.success('Delivery location saved');
  };

  return (
    <Card className="border-accent/30">
      <CardHeader className={compact ? 'pb-3' : undefined}>
        <CardTitle className="font-display flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5 text-accent" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <div className="space-y-1">
            <Label>City</Label>
            <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Bhiwadi" />
          </div>
          <div className="space-y-1">
            <Label>Pincode</Label>
            <Input
              value={pincode}
              onChange={(event) => setPincode(normalizePincode(event.target.value))}
              placeholder="301019"
              inputMode="numeric"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSave} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </div>

        {routing && !routing.isServiceable ? (
          <div className="rounded-lg border border-dashed p-4 bg-muted">
            <p className="text-sm text-muted-foreground">We could not match this location to the current delivery network.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
