import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Lock, MapPin, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { normalizePincode, saveSessionLocation } from '@/lib/hubNetwork';
import { defaultBillingAddress, normalizeGSTIN, type BillingAddress } from '@/lib/businessAccounts';

type Address = { id: string; label: string; address_line1: string; city: string; state: string; pincode: string; is_default: boolean };
type BusinessAccount = {
  id: string;
  legal_name: string;
  display_name: string;
  gstin: string;
  billing_address: BillingAddress | null;
  payment_terms: string;
};

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [company, setCompany] = useState(profile?.company_name || '');
  const [designation, setDesignation] = useState(profile?.designation || '');
  const [preferredCity, setPreferredCity] = useState(profile?.preferred_city || '');
  const [preferredPincode, setPreferredPincode] = useState(profile?.preferred_pincode || '');
  const [whatsappOptIn, setWhatsappOptIn] = useState(profile?.whatsapp_opt_in ?? true);
  const [businessAccountId, setBusinessAccountId] = useState(profile?.business_account_id || null);
  const [legalName, setLegalName] = useState(profile?.company_name || '');
  const [gstin, setGstin] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Advance');
  const [billingAddress, setBillingAddress] = useState<BillingAddress>(defaultBillingAddress);
  const [saving, setSaving] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name);
      setPhone(profile.phone);
      setCompany(profile.company_name);
      setDesignation(profile.designation || '');
      setPreferredCity(profile.preferred_city || '');
      setPreferredPincode(profile.preferred_pincode || '');
      setWhatsappOptIn(profile.whatsapp_opt_in ?? true);
      setBusinessAccountId(profile.business_account_id || null);
      setLegalName(profile.company_name || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from('saved_addresses').select('*').eq('user_id', user.id).then(({ data }) => setAddresses(data || []));
  }, [user]);

  useEffect(() => {
    if (!businessAccountId) {
      setGstin('');
      setPaymentTerms('Advance');
      setBillingAddress(defaultBillingAddress);
      return;
    }

    supabase
      .from('business_accounts')
      .select('id, legal_name, display_name, gstin, billing_address, payment_terms')
      .eq('id', businessAccountId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const account = data as BusinessAccount;
        setLegalName(account.legal_name || account.display_name || '');
        setCompany(account.display_name || '');
        setGstin(account.gstin || '');
        setPaymentTerms(account.payment_terms || 'Advance');
        setBillingAddress({
          ...defaultBillingAddress,
          ...(account.billing_address || {}),
        });
      });
  }, [businessAccountId]);

  const updateBillingAddress = (field: keyof BillingAddress, value: string) => {
    setBillingAddress((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    let nextBusinessAccountId = businessAccountId;
    const normalizedCompany = company.trim();
    const normalizedLegalName = legalName.trim() || normalizedCompany;
    const normalizedGstin = normalizeGSTIN(gstin);

    if (normalizedCompany) {
      if (!nextBusinessAccountId) {
        const { data: ensuredBusinessAccountId, error: ensureError } = await supabase.rpc('ensure_business_account', {
          _display_name: normalizedCompany,
          _legal_name: normalizedLegalName,
          _gstin: normalizedGstin,
          _contact_email: user.email || '',
          _contact_phone: phone,
          _created_by: user.id,
        });

        if (ensureError) {
          setSaving(false);
          toast.error('Failed to create business account');
          return;
        }

        nextBusinessAccountId = ensuredBusinessAccountId || null;
        setBusinessAccountId(nextBusinessAccountId);
      } else {
        const { error: businessError } = await supabase
          .from('business_accounts')
          .update({
            legal_name: normalizedLegalName,
            display_name: normalizedCompany,
            gstin: normalizedGstin,
            contact_email: user.email || '',
            contact_phone: phone,
            payment_terms: paymentTerms,
            billing_address: billingAddress,
          })
          .eq('id', nextBusinessAccountId);

        if (businessError) {
          setSaving(false);
          toast.error('Failed to update business account');
          return;
        }
      }
    }

    await supabase.from('profiles').update({
      full_name: name,
      phone,
      company_name: normalizedCompany,
      designation,
      email: user.email || '',
      business_account_id: nextBusinessAccountId,
      preferred_city: preferredCity,
      preferred_pincode: normalizePincode(preferredPincode),
      whatsapp_opt_in: whatsappOptIn,
    }).eq('user_id', user.id);
    saveSessionLocation({ city: preferredCity, pincode: normalizePincode(preferredPincode) });
    await refreshProfile();
    setSaving(false);
    toast.success('Profile updated');
  };

  const changePassword = async () => {
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setChangingPw(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated');
    setOldPw(''); setNewPw('');
  };

  return (
    <div className="space-y-4 max-w-2xl animate-slide-in">
      <h1 className="font-display text-2xl font-bold">My Profile</h1>

      <Card className="border">
        <CardHeader><CardTitle className="font-display flex items-center gap-2"><User className="w-5 h-5" /> Personal Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1"><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label>Email</Label><Input value={user?.email || ''} disabled /></div>
          <div className="space-y-1"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <div className="space-y-1"><Label>Company</Label><Input value={company} onChange={e => setCompany(e.target.value)} /></div>
          <div className="space-y-1"><Label>Designation</Label><Input value={designation} onChange={e => setDesignation(e.target.value)} /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label>Preferred City</Label><Input value={preferredCity} onChange={e => setPreferredCity(e.target.value)} /></div>
            <div className="space-y-1"><Label>Preferred Pincode</Label><Input value={preferredPincode} onChange={e => setPreferredPincode(normalizePincode(e.target.value))} /></div>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox checked={whatsappOptIn} onCheckedChange={(checked) => setWhatsappOptIn(checked === true)} />
            <span className="text-sm text-muted-foreground">Send WhatsApp delivery updates for routed orders</span>
          </div>
          <p className="text-xs text-muted-foreground">Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</p>
          <Button onClick={saveProfile} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} SAVE CHANGES
          </Button>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader><CardTitle className="font-display">Business Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label>Display Name</Label><Input value={company} onChange={e => setCompany(e.target.value)} placeholder="ABC Builders" /></div>
            <div className="space-y-1"><Label>Legal Name</Label><Input value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="ABC Builders Private Limited" /></div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label>GSTIN</Label><Input value={gstin} onChange={e => setGstin(normalizeGSTIN(e.target.value))} placeholder="27ABCDE1234F1Z5" /></div>
            <div className="space-y-1"><Label>Payment Terms</Label><Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="Advance / 30 Days Credit" /></div>
          </div>
          <div className="space-y-1"><Label>Billing Address Line 1</Label><Input value={billingAddress.line1} onChange={e => updateBillingAddress('line1', e.target.value)} /></div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1"><Label>Billing City</Label><Input value={billingAddress.city} onChange={e => updateBillingAddress('city', e.target.value)} /></div>
            <div className="space-y-1"><Label>Billing State</Label><Input value={billingAddress.state} onChange={e => updateBillingAddress('state', e.target.value)} /></div>
            <div className="space-y-1"><Label>Billing Pincode</Label><Input value={billingAddress.pincode} onChange={e => updateBillingAddress('pincode', normalizePincode(e.target.value))} /></div>
          </div>
          <p className="text-xs text-muted-foreground">These details are copied into quote and PO records so admin, accounts, and dispatch teams see stable business information.</p>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader><CardTitle className="font-display flex items-center gap-2"><Lock className="w-5 h-5" /> Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1"><Label>New Password</Label><Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
          <Button onClick={changePassword} disabled={!newPw || changingPw} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display">
            {changingPw ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} UPDATE PASSWORD
          </Button>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader>
          <CardTitle className="font-display flex items-center justify-between">
            <span className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Saved Addresses</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {addresses.length === 0 && <p className="text-sm text-muted-foreground">No saved addresses</p>}
          {addresses.map(a => (
            <div key={a.id} className="border rounded p-3 flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{a.label} {a.is_default && <Badge className="bg-accent text-accent-foreground text-[10px] ml-1">Default</Badge>}</p>
                <p className="text-xs text-muted-foreground">{a.address_line1}, {a.city}, {a.state} - {a.pincode}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={async () => {
                await supabase.from('saved_addresses').delete().eq('id', a.id);
                setAddresses(prev => prev.filter(x => x.id !== a.id));
                toast.success('Address removed');
              }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-destructive/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Delete Account</p>
            <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>Delete Account</Button>
        </CardContent>
      </Card>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Account</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone. All your data will be permanently deleted.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => toast.error('Please contact support to delete your account')}>Confirm Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
