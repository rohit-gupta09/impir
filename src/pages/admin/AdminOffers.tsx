import { useEffect, useState } from 'react';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

type Offer = {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value);

const emptyForm = {
  code: '',
  title: '',
  description: '',
  discount_type: 'flat',
  discount_value: '0',
  min_order_amount: '0',
  max_discount_amount: '',
  starts_at: '',
  ends_at: '',
  is_active: true,
};

export default function AdminOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadOffers = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('quote_checkout_offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load offers');
      setLoading(false);
      return;
    }

    setOffers((data || []) as Offer[]);
    setLoading(false);
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (offer: Offer) => {
    setEditing(offer);
    setForm({
      code: offer.code,
      title: offer.title,
      description: offer.description || '',
      discount_type: offer.discount_type,
      discount_value: String(offer.discount_value),
      min_order_amount: String(offer.min_order_amount),
      max_discount_amount: offer.max_discount_amount === null ? '' : String(offer.max_discount_amount),
      starts_at: offer.starts_at ? offer.starts_at.slice(0, 16) : '',
      ends_at: offer.ends_at ? offer.ends_at.slice(0, 16) : '',
      is_active: offer.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const code = form.code.trim().toUpperCase();
    const title = form.title.trim();
    const discountValue = Number(form.discount_value);
    const minOrderAmount = Number(form.min_order_amount);
    const maxDiscountAmount = form.max_discount_amount.trim() ? Number(form.max_discount_amount) : null;

    if (!code || !title) {
      toast.error('Code and title are required');
      return;
    }

    if (Number.isNaN(discountValue) || discountValue <= 0) {
      toast.error('Enter a valid discount value');
      return;
    }

    if (Number.isNaN(minOrderAmount) || minOrderAmount < 0) {
      toast.error('Enter a valid minimum order amount');
      return;
    }

    if (maxDiscountAmount !== null && (Number.isNaN(maxDiscountAmount) || maxDiscountAmount <= 0)) {
      toast.error('Enter a valid maximum discount amount');
      return;
    }

    setSaving(true);

    const payload = {
      code,
      title,
      description: form.description.trim(),
      discount_type: form.discount_type,
      discount_value: discountValue,
      min_order_amount: minOrderAmount,
      max_discount_amount: form.discount_type === 'percent' ? maxDiscountAmount : null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      is_active: form.is_active,
    };

    const response = editing
      ? await (supabase as any).from('quote_checkout_offers').update(payload).eq('id', editing.id)
      : await (supabase as any).from('quote_checkout_offers').insert(payload);

    if (response.error) {
      toast.error(editing ? 'Failed to update offer' : 'Failed to create offer');
      setSaving(false);
      return;
    }

    toast.success(editing ? 'Offer updated' : 'Offer created');
    setSaving(false);
    setDialogOpen(false);
    loadOffers();
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any)
      .from('quote_checkout_offers')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete offer');
      return;
    }

    toast.success('Offer deleted');
    loadOffers();
  };

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Checkout Offers</h1>
          <p className="text-sm text-muted-foreground">Manage quote checkout discounts shown before payment.</p>
        </div>
        <Button onClick={openCreate} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display">
          <Plus className="w-4 h-4 mr-2" />
          Add Offer
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Offers</p><p className="mt-1 font-display text-2xl font-bold">{offers.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active Offers</p><p className="mt-1 font-display text-2xl font-bold">{offers.filter((offer) => offer.is_active).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Percent Discounts</p><p className="mt-1 font-display text-2xl font-bold">{offers.filter((offer) => offer.discount_type === 'percent').length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Tag className="w-5 h-5 text-accent" />
            Offer List
          </CardTitle>
          <CardDescription>Customers can apply only active offers during quote payment.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : offers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No offers created yet.</p>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="rounded-md border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{offer.title}</p>
                        <Badge variant="secondary">{offer.code}</Badge>
                        <Badge variant={offer.is_active ? 'default' : 'outline'}>
                          {offer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {offer.discount_type === 'percent' ? `${offer.discount_value}% off` : `${formatINR(offer.discount_value)} off`}
                        </Badge>
                      </div>
                      {offer.description && <p className="text-sm text-muted-foreground">{offer.description}</p>}
                      <p className="text-sm text-muted-foreground">
                        Minimum order: {formatINR(offer.min_order_amount)}
                        {offer.max_discount_amount !== null && ` • Max discount: ${formatINR(offer.max_discount_amount)}`}
                      </p>
                      {(offer.starts_at || offer.ends_at) && (
                        <p className="text-xs text-muted-foreground">
                          {offer.starts_at ? `Starts ${new Date(offer.starts_at).toLocaleString()}` : 'Starts immediately'}
                          {' • '}
                          {offer.ends_at ? `Ends ${new Date(offer.ends_at).toLocaleString()}` : 'No expiry'}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(offer)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete offer?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {offer.code} from quote checkout.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(offer.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Edit Offer' : 'Create Offer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="offer-code">Code</Label>
                <Input id="offer-code" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="SAVE500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-title">Title</Label>
                <Input id="offer-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Flat ₹500 Off" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer-description">Description</Label>
              <Textarea id="offer-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Visible to the customer during checkout." />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={(value) => setForm((current) => ({ ...current, discount_type: value as 'flat' | 'percent' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Amount</SelectItem>
                    <SelectItem value="percent">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-value">Discount Value</Label>
                <Input id="discount-value" type="number" min="0" step="0.01" value={form.discount_value} onChange={(event) => setForm((current) => ({ ...current, discount_value: event.target.value }))} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="min-order">Minimum Order Amount</Label>
                <Input id="min-order" type="number" min="0" step="0.01" value={form.min_order_amount} onChange={(event) => setForm((current) => ({ ...current, min_order_amount: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-discount">Maximum Discount</Label>
                <Input id="max-discount" type="number" min="0" step="0.01" value={form.max_discount_amount} onChange={(event) => setForm((current) => ({ ...current, max_discount_amount: event.target.value }))} placeholder={form.discount_type === 'percent' ? 'Optional cap' : 'Not used for flat offers'} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="starts-at">Starts At</Label>
                <Input id="starts-at" type="datetime-local" value={form.starts_at} onChange={(event) => setForm((current) => ({ ...current, starts_at: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends-at">Ends At</Label>
                <Input id="ends-at" type="datetime-local" value={form.ends_at} onChange={(event) => setForm((current) => ({ ...current, ends_at: event.target.value }))} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Offer Active</p>
                <p className="text-xs text-muted-foreground">Inactive offers will not appear in checkout.</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(checked) => setForm((current) => ({ ...current, is_active: checked }))} />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-display">
                {saving ? 'Saving...' : editing ? 'Update Offer' : 'Create Offer'}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
