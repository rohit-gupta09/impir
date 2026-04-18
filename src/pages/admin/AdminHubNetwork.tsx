import { useEffect, useState } from 'react';
import { ArrowRightLeft, Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const emptyHubForm = {
  city_name: '',
  state: '',
  pincode_range: '',
  hub_manager_name: '',
  hub_manager_phone: '',
  delivery_radius_km: '20',
  same_day_cutoff_time: '14:00',
};

export default function AdminHubNetwork() {
  const [loading, setLoading] = useState(true);
  const [hubs, setHubs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [hubForm, setHubForm] = useState(emptyHubForm);
  const [transfer, setTransfer] = useState({ from_hub_id: '', to_hub_id: '', product_id: '', quantity: '1', notes: '' });
  const [reviewingApplicationId, setReviewingApplicationId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: hubRows }, { data: productRows }, { data: inventoryRows }, { data: applicationRows }] = await Promise.all([
      (supabase as any).from('hubs').select('*').order('city_name'),
      supabase.from('products').select('id, name, sku').order('name'),
      (supabase as any).from('hub_inventory').select('hub_id, product_id, quantity_available, reorder_level, last_updated, hubs(city_name), products(name, sku)').order('last_updated', { ascending: false }),
      (supabase as any).from('franchise_partner_applications').select('*').order('created_at', { ascending: false }),
    ]);

    setHubs(hubRows || []);
    setProducts(productRows || []);
    setInventory(inventoryRows || []);
    setApplications(applicationRows || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveHub = async (event: React.FormEvent) => {
    event.preventDefault();
    const { error } = await (supabase as any).from('hubs').insert({
      city_name: hubForm.city_name,
      state: hubForm.state,
      pincode_range: hubForm.pincode_range,
      hub_manager_name: hubForm.hub_manager_name,
      hub_manager_phone: hubForm.hub_manager_phone,
      delivery_radius_km: Number(hubForm.delivery_radius_km) || 20,
      same_day_cutoff_time: hubForm.same_day_cutoff_time,
    });
    if (error) {
      toast.error('Failed to create hub');
      return;
    }
    toast.success('Hub created');
    setHubForm(emptyHubForm);
    load();
  };

  const runTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    const { error } = await (supabase.rpc as any)('transfer_hub_inventory', {
      _from_hub_id: transfer.from_hub_id,
      _to_hub_id: transfer.to_hub_id,
      _product_id: transfer.product_id,
      _quantity: Number(transfer.quantity),
      _notes: transfer.notes,
    });
    if (error) {
      toast.error(error.message || 'Transfer failed');
      return;
    }
    toast.success('Stock transferred');
    setTransfer({ from_hub_id: '', to_hub_id: '', product_id: '', quantity: '1', notes: '' });
    load();
  };

  const updateReorderLevel = async (hubId: string, productId: string, reorderLevel: number) => {
    const { error } = await (supabase as any)
      .from('hub_inventory')
      .update({ reorder_level: reorderLevel, last_updated: new Date().toISOString() })
      .eq('hub_id', hubId)
      .eq('product_id', productId);
    if (error) {
      toast.error('Failed to save reorder level');
      return;
    }
    toast.success('Reorder level updated');
    load();
  };

  const reviewApplication = async (application: any, nextStatus: 'approved' | 'rejected') => {
    setReviewingApplicationId(application.id);

    let approvedSupplierId: string | null = null;

    if (nextStatus === 'approved') {
      const existingSupplierResponse = await supabase
        .from('suppliers')
        .select('id')
        .ilike('name', application.name)
        .maybeSingle();

      if (existingSupplierResponse.error) {
        toast.error(existingSupplierResponse.error.message || 'Failed to check existing supplier');
        setReviewingApplicationId(null);
        return;
      }

      approvedSupplierId = existingSupplierResponse.data?.id || null;

      if (!approvedSupplierId) {
        const insertSupplierResponse = await supabase
          .from('suppliers')
          .insert({
            name: application.name,
            contact_person: application.name,
            phone: application.phone_number,
            notes: [
              `Approved from supplier partner application.`,
              `City: ${application.city}`,
              `Business type: ${application.current_business_type}`,
              `Product types: ${application.monthly_hardware_purchases}`,
              `Shop/Godown: ${application.has_shop_or_godown ? 'Yes' : 'No'}`,
            ].join(' '),
            is_active: true,
          })
          .select('id')
          .single();

        if (insertSupplierResponse.error) {
          toast.error(insertSupplierResponse.error.message || 'Failed to create supplier from application');
          setReviewingApplicationId(null);
          return;
        }

        approvedSupplierId = insertSupplierResponse.data.id;
      }
    }

    const { error } = await (supabase as any)
      .from('franchise_partner_applications')
      .update({
        status: nextStatus,
        reviewed_at: new Date().toISOString(),
        approved_supplier_id: nextStatus === 'approved' ? approvedSupplierId : null,
      })
      .eq('id', application.id);

    setReviewingApplicationId(null);

    if (error) {
      toast.error(error.message || `Failed to ${nextStatus} application`);
      return;
    }

    toast.success(nextStatus === 'approved' ? 'Application approved and supplier added' : 'Application rejected');
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Hub Network</h1>
        <p className="text-sm text-muted-foreground">Manage hubs, stock levels, transfers, reorder thresholds, and incoming city partner applications.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-display">Create New Hub</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={saveHub} className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1"><Label>City</Label><Input value={hubForm.city_name} onChange={(e) => setHubForm((prev) => ({ ...prev, city_name: e.target.value }))} required /></div>
              <div className="space-y-1"><Label>State</Label><Input value={hubForm.state} onChange={(e) => setHubForm((prev) => ({ ...prev, state: e.target.value }))} required /></div>
              <div className="space-y-1 md:col-span-2"><Label>Pincode Range</Label><Input value={hubForm.pincode_range} onChange={(e) => setHubForm((prev) => ({ ...prev, pincode_range: e.target.value }))} placeholder="301001-301030,301101-301199" required /></div>
              <div className="space-y-1"><Label>Hub Manager Name</Label><Input value={hubForm.hub_manager_name} onChange={(e) => setHubForm((prev) => ({ ...prev, hub_manager_name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Hub Manager Phone</Label><Input value={hubForm.hub_manager_phone} onChange={(e) => setHubForm((prev) => ({ ...prev, hub_manager_phone: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Delivery Radius (km)</Label><Input value={hubForm.delivery_radius_km} onChange={(e) => setHubForm((prev) => ({ ...prev, delivery_radius_km: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Same-day Cutoff</Label><Input type="time" value={hubForm.same_day_cutoff_time} onChange={(e) => setHubForm((prev) => ({ ...prev, same_day_cutoff_time: e.target.value }))} /></div>
              <div className="md:col-span-2">
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">Create Hub</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><ArrowRightLeft className="w-5 h-5" /> Transfer Stock Between Hubs</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={runTransfer} className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>From Hub</Label>
                <Select value={transfer.from_hub_id} onValueChange={(value) => setTransfer((prev) => ({ ...prev, from_hub_id: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select hub" /></SelectTrigger>
                  <SelectContent>{hubs.map((hub) => <SelectItem key={hub.id} value={hub.id}>{hub.city_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>To Hub</Label>
                <Select value={transfer.to_hub_id} onValueChange={(value) => setTransfer((prev) => ({ ...prev, to_hub_id: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select hub" /></SelectTrigger>
                  <SelectContent>{hubs.map((hub) => <SelectItem key={hub.id} value={hub.id}>{hub.city_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Product</Label>
                <Select value={transfer.product_id} onValueChange={(value) => setTransfer((prev) => ({ ...prev, product_id: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name} ({product.sku})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Quantity</Label><Input type="number" min="1" value={transfer.quantity} onChange={(e) => setTransfer((prev) => ({ ...prev, quantity: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Notes</Label><Input value={transfer.notes} onChange={(e) => setTransfer((prev) => ({ ...prev, notes: e.target.value }))} /></div>
              <div className="md:col-span-2">
                <Button type="submit" variant="outline">Transfer Stock</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display">Stock Across All Hubs</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading hub inventory...</div> : inventory.map((item) => (
            <div key={`${item.hub_id}-${item.product_id}`} className="rounded-md border p-3 grid gap-3 md:grid-cols-[1fr_150px_150px_160px] md:items-center">
              <div>
                <p className="font-medium">{item.products?.name || 'Product'}</p>
                <p className="text-xs text-muted-foreground">{item.hubs?.city_name || 'Hub'} · {item.products?.sku || item.product_id}</p>
              </div>
              <div className="text-sm">{item.quantity_available} units</div>
              <div className="text-sm text-muted-foreground">Updated {new Date(item.last_updated).toLocaleDateString()}</div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  defaultValue={item.reorder_level}
                  onBlur={(event) => updateReorderLevel(item.hub_id, item.product_id, Number(event.target.value) || 0)}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Reorder</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display">Franchise Partner Applications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {applications.length === 0 ? <p className="text-sm text-muted-foreground">No applications yet.</p> : applications.map((application) => (
            <div key={application.id} className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">{application.name} · {application.city}</p>
                  <p className="text-xs text-muted-foreground">{new Date(application.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">{application.status || 'new'}</span>
                  {application.status !== 'approved' && application.status !== 'rejected' ? (
                    <>
                      <Button
                        size="sm"
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
                        disabled={reviewingApplicationId === application.id}
                        onClick={() => reviewApplication(application, 'approved')}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewingApplicationId === application.id}
                        onClick={() => reviewApplication(application, 'rejected')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{application.current_business_type}</p>
              <p className="text-sm">Phone: {application.phone_number}</p>
              <p className="text-sm">Product types they deal in: {application.monthly_hardware_purchases}</p>
              <p className="text-sm">Shop/Godown: {application.has_shop_or_godown ? 'Yes' : 'No'}</p>
              {application.status === 'approved' && application.approved_supplier_id ? (
                <p className="text-xs text-muted-foreground">Added to supplier database.</p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
