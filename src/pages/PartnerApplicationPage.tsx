import { useEffect, useState } from 'react';
import { Loader2, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const emptyForm = {
  name: '',
  city: '',
  current_business_type: '',
  has_shop_or_godown: 'yes',
  monthly_hardware_purchases: '',
  phone_number: '',
  email: '',
  address_line1: '',
  state: '',
  pincode: '',
};

export default function PartnerApplicationPage() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: prev.name || profile?.full_name || '',
      city: prev.city || profile?.preferred_city || '',
      phone_number: prev.phone_number || profile?.phone || '',
      email: prev.email || profile?.email || user?.email || '',
      pincode: prev.pincode || profile?.preferred_pincode || '',
    }));
  }, [profile, user]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const { error } = await (supabase as any).from('franchise_partner_applications').insert({
      name: form.name,
      city: form.city,
      current_business_type: form.current_business_type,
      has_shop_or_godown: form.has_shop_or_godown === 'yes',
      monthly_hardware_purchases: form.monthly_hardware_purchases,
      phone_number: form.phone_number,
      email: form.email || null,
      address_line1: form.address_line1 || null,
      state: form.state || null,
      pincode: form.pincode || null,
      user_id: user?.id || null,
    });

    setSubmitting(false);
    if (error) {
      toast.error('Failed to submit application');
      return;
    }

    setForm(emptyForm);
    toast.success('Application submitted. Our team will review, meet you if needed, and notify you after approval.');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="font-display text-3xl font-bold">Become a SupplyWala Partner in Your City</h1>
          <p className="text-muted-foreground">
            Grow with our multi-city hub network. Tell us about your business and we will review your city for the next expansion wave.
          </p>
        </div>

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="font-display">Partner Application</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={(event) => update('name', event.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input value={form.city} onChange={(event) => update('city', event.target.value)} required />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Current Business Type</Label>
                <Input value={form.current_business_type} onChange={(event) => update('current_business_type', event.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Do You Have a Shop/Godown?</Label>
                <Select value={form.has_shop_or_godown} onValueChange={(value) => update('has_shop_or_godown', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>What Types of Products Do You Deal In?</Label>
                <Input
                  value={form.monthly_hardware_purchases}
                  onChange={(event) => update('monthly_hardware_purchases', event.target.value)}
                  placeholder="Fasteners, power tools, safety items, electricals"
                  required
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Phone Number</Label>
                <Input value={form.phone_number} onChange={(event) => update('phone_number', event.target.value)} required />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="supplier@example.com" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Shop / Godown Address</Label>
                <Input value={form.address_line1} onChange={(event) => update('address_line1', event.target.value)} placeholder="Warehouse no, street, area" required />
              </div>
              <div className="space-y-1">
                <Label>State</Label>
                <Input value={form.state} onChange={(event) => update('state', event.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Postal Code</Label>
                <Input value={form.pincode} onChange={(event) => update('pincode', event.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Submit Application
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
