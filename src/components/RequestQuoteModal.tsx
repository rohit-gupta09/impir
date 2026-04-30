import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import SavedAddressSelector, { saveQuoteAddress } from '@/components/SavedAddressSelector';
import { resolveRoutingForItems, type RoutingResult } from '@/lib/hubNetwork';
import { queueQuoteSubmittedWhatsapp } from '@/lib/whatsappNotifications';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RequestQuoteModal({ open, onOpenChange }: Props) {
  const { user, profile } = useAuth();
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [routing, setRouting] = useState<RoutingResult | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Site address');
  const [form, setForm] = useState({
    company: profile?.company_name || '',
    projectType: 'Residential',
    description: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
    timeline: 'Flexible',
    contactMethod: 'Email',
    agreed: false,
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      city: profile?.preferred_city || prev.city,
      pincode: profile?.preferred_pincode || prev.pincode,
    }));
  }, [profile?.preferred_city, profile?.preferred_pincode]);

  useEffect(() => {
    if (!form.city.trim() || form.pincode.trim().length !== 6) {
      setRouting(null);
      return;
    }

    resolveRoutingForItems(
      { city: form.city, pincode: form.pincode },
      items.map((item) => ({ product_id: item.product_id, quantity: item.quantity, name: item.product.name })),
    )
      .then((result) => setRouting(result))
      .catch(() => setRouting(null));
  }, [form.city, form.pincode, items]);

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.agreed) return;
    if (!routing?.isServiceable) {
      toast.error('This location is not serviceable yet');
      return;
    }
    setLoading(true);

    const productsData = items.map(i => ({
      product_id: i.product_id,
      name: i.product.name,
      quantity: i.quantity,
      unit: i.product.unit,
      sku: i.product.sku,
    }));

    const { data, error } = await supabase.from('quotes').insert({
      user_id: user.id,
      business_account_id: profile?.business_account_id || null,
      business_name: form.company.trim(),
      requested_by_name: profile?.full_name || '',
      requested_by_email: user.email || profile?.email || '',
      requested_by_phone: profile?.phone || '',
      products: productsData,
      project_type: form.projectType,
      project_description: form.description,
      billing_address: {
        line1: form.addressLine1,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      },
      delivery_address: {
        line1: form.addressLine1,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      },
      routing_summary: {
        route_type: routing?.routeType,
        promise_text: routing?.promiseText,
        summary_text: routing?.summaryText,
        assigned_hub_id: routing?.assignedHub?.id || null,
        assigned_hub_city: routing?.assignedHub?.city_name || null,
        matched_hub_id: routing?.matchedHub?.id || null,
      },
      timeline: form.timeline,
      contact_method: form.contactMethod,
      payment_terms: 'To Be Confirmed',
      quote_number: 'temp',
    }).select('id, quote_number').single();

    setLoading(false);
    if (error) { toast.error('Failed to submit quote'); return; }

    if (saveAddress) {
      await saveQuoteAddress(user.id, {
        addressLine1: form.addressLine1,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      }, addressLabel);
    }

    // Notify admins
    await supabase.from('admin_notifications').insert({
      message: `New quote ${data.quote_number} submitted by ${profile?.full_name || 'a customer'} with ${items.length} items.`,
      type: 'quote',
      reference_id: null,
    });
    queueQuoteSubmittedWhatsapp({
      quoteNumber: data.quote_number,
      customerName: profile?.full_name || '',
      customerPhone: profile?.whatsapp_opt_in !== false ? profile?.phone || '' : '',
      companyName: form.company,
      itemCount: items.length,
      projectType: form.projectType,
      status: 'Pending',
    });

    await clearCart();
    setSuccess(data.quote_number);
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setSuccess(null); onOpenChange(false); navigate('/quotes'); } }}>
        <DialogContent>
          <div className="text-center py-6 space-y-4">
            <CheckCircle className="w-16 h-16 text-status-responded mx-auto" />
            <h2 className="font-display text-2xl font-bold">Quote Submitted!</h2>
            <p className="text-muted-foreground">Your quote <strong>{success}</strong> has been submitted.</p>
            <p className="text-sm text-muted-foreground">We'll respond within 24-48 hours.</p>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-display" onClick={() => { setSuccess(null); onOpenChange(false); navigate('/quotes'); }}>
              VIEW MY QUOTES
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Request a Quote</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={profile?.full_name || ''} disabled />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={profile?.phone || ''} disabled />
            </div>
            <div className="space-y-1">
              <Label>Company</Label>
              <Input value={form.company} onChange={e => update('company', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Project Type</Label>
              <Select value={form.projectType} onValueChange={v => update('projectType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Residential', 'Commercial', 'Industrial', 'Government', 'Other'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Timeline</Label>
              <Select value={form.timeline} onValueChange={v => update('timeline', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['ASAP', 'Within 1 Week', 'Within 1 Month', 'Flexible'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Project Description / Special Requirements</Label>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Any special requirements..." rows={3} />
          </div>

          <SavedAddressSelector
            userId={user?.id || null}
            value={{
              addressLine1: form.addressLine1,
              city: form.city,
              state: form.state,
              pincode: form.pincode,
            }}
            onChange={(address) => setForm((prev) => ({ ...prev, ...address }))}
            saveAddress={saveAddress}
            onSaveAddressChange={setSaveAddress}
            addressLabel={addressLabel}
            onAddressLabelChange={setAddressLabel}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Address Line 1</Label>
              <Input value={form.addressLine1} onChange={e => update('addressLine1', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>City</Label>
              <Input value={form.city} onChange={e => update('city', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>State</Label>
              <Input value={form.state} onChange={e => update('state', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Pincode</Label>
              <Input value={form.pincode} onChange={e => update('pincode', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Preferred Contact</Label>
              <Select value={form.contactMethod} onValueChange={v => update('contactMethod', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Email', 'Phone', 'WhatsApp'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products summary */}
          <div>
            <Label>Products ({items.length})</Label>
            <div className="border rounded mt-1 max-h-32 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr><th className="text-left p-2">Product</th><th className="p-2">Qty</th><th className="p-2">Unit</th></tr>
                </thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i.id} className="border-t">
                      <td className="p-2">{i.product.name}</td>
                      <td className="p-2 text-center">{i.quantity}</td>
                      <td className="p-2 text-center">{i.product.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox checked={form.agreed} onCheckedChange={v => update('agreed', v === true)} />
            <span className="text-sm text-muted-foreground">I agree to the terms and conditions for quote requests</span>
          </div>

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-display tracking-wide"
            disabled={loading || !form.agreed || !routing?.isServiceable}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            SUBMIT QUOTE REQUEST
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
