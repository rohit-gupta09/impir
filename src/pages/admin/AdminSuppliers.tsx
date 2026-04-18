import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Pencil, Search, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type Product = {
  id: string;
  name: string;
  sku: string;
};

type Supplier = {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
};

type SupplierPrice = {
  id: string;
  product_id: string;
  supplier_id: string;
  location_name: string;
  price: number;
  lead_time_days: number;
  min_order_quantity: number;
  notes: string | null;
  is_preferred: boolean;
  supplier: { id: string; name: string; phone: string | null; email: string | null; contact_person: string | null } | null;
  product: { id: string; name: string; sku: string } | null;
};

const emptySupplierForm = { name: '', contact_person: '', phone: '', email: '', notes: '', is_active: true };
const emptySupplierPriceForm = { product_id: '', supplier_id: '', location_name: '', price: '', min_order_quantity: '1', lead_time_days: '0', notes: '', is_preferred: false };
const noSelectionValue = 'none';

export default function AdminSuppliers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierPrices, setSupplierPrices] = useState<SupplierPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [savingSupplierPrice, setSavingSupplierPrice] = useState(false);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [supplierPriceForm, setSupplierPriceForm] = useState(emptySupplierPriceForm);
  const [pricingProductFilter, setPricingProductFilter] = useState(noSelectionValue);
  const [searchProductId, setSearchProductId] = useState(noSelectionValue);
  const [searchLocation, setSearchLocation] = useState('');
  const [editingSupplierPriceId, setEditingSupplierPriceId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [productRes, supplierRes, supplierPriceRes] = await Promise.all([
      supabase.from('products').select('id, name, sku').order('name'),
      supabase.from('suppliers').select('*').order('name'),
      supabase
        .from('supplier_product_prices')
        .select('id, product_id, supplier_id, location_name, price, lead_time_days, min_order_quantity, notes, is_preferred, suppliers(id, name, phone, email, contact_person), products(id, name, sku)')
        .order('is_preferred', { ascending: false })
        .order('price', { ascending: true }),
    ]);

    setProducts(productRes.data || []);
    setSuppliers(supplierRes.data || []);
    setSupplierPrices((supplierPriceRes.data || []).map((item: any) => ({
      ...item,
      supplier: item.suppliers,
      product: item.products,
    })));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    setSavingSupplier(true);
    const { error } = await supabase.from('suppliers').insert({
      name: supplierForm.name.trim(),
      contact_person: supplierForm.contact_person.trim() || null,
      phone: supplierForm.phone.trim() || null,
      email: supplierForm.email.trim() || null,
      notes: supplierForm.notes.trim() || null,
      is_active: supplierForm.is_active,
    });

    if (error) toast.error(error.message || 'Failed to add supplier');
    else {
      toast.success('Supplier added');
      setSupplierForm(emptySupplierForm);
      fetchData();
    }
    setSavingSupplier(false);
  };

  const handleSaveSupplierPrice = async () => {
    if (!supplierPriceForm.product_id || !supplierPriceForm.supplier_id || !supplierPriceForm.location_name.trim() || !supplierPriceForm.price.trim()) {
      toast.error('Product, supplier, location, and price are required');
      return;
    }

    setSavingSupplierPrice(true);
    const payload = {
      product_id: supplierPriceForm.product_id,
      supplier_id: supplierPriceForm.supplier_id,
      location_name: supplierPriceForm.location_name.trim(),
      price: Number(supplierPriceForm.price),
      min_order_quantity: Math.max(1, Number(supplierPriceForm.min_order_quantity) || 1),
      lead_time_days: Math.max(0, Number(supplierPriceForm.lead_time_days) || 0),
      notes: supplierPriceForm.notes.trim() || null,
      is_preferred: supplierPriceForm.is_preferred,
    };

    const query = editingSupplierPriceId
      ? supabase.from('supplier_product_prices').update(payload).eq('id', editingSupplierPriceId)
      : supabase.from('supplier_product_prices').insert(payload);
    const { error } = await query;

    if (error) toast.error(error.message || 'Failed to save supplier pricing');
    else {
      toast.success(editingSupplierPriceId ? 'Supplier pricing updated' : 'Supplier pricing saved');
      setSupplierPriceForm(emptySupplierPriceForm);
      setEditingSupplierPriceId(null);
      fetchData();
    }
    setSavingSupplierPrice(false);
  };

  const startEditingSupplierPrice = (item: SupplierPrice) => {
    setEditingSupplierPriceId(item.id);
    setSupplierPriceForm({
      product_id: item.product_id,
      supplier_id: item.supplier_id,
      location_name: item.location_name,
      price: String(item.price),
      min_order_quantity: String(item.min_order_quantity),
      lead_time_days: String(item.lead_time_days),
      notes: item.notes || '',
      is_preferred: item.is_preferred,
    });
  };

  const cancelEditingSupplierPrice = () => {
    setEditingSupplierPriceId(null);
    setSupplierPriceForm(emptySupplierPriceForm);
  };

  const handleDeleteSupplierPrice = async (id: string) => {
    const { error } = await supabase.from('supplier_product_prices').delete().eq('id', id);
    if (error) toast.error(error.message || 'Failed to delete pricing');
    else {
      toast.success('Supplier pricing deleted');
      fetchData();
    }
  };

  const filteredSupplierPrices = useMemo(
    () => supplierPrices.filter((item) => pricingProductFilter === noSelectionValue || item.product_id === pricingProductFilter),
    [pricingProductFilter, supplierPrices],
  );

  const matchedSupplierResults = useMemo(() => {
    const normalizedLocation = searchLocation.trim().toLowerCase();

    return supplierPrices.filter((item) => {
      const matchesProduct = searchProductId === noSelectionValue || item.product_id === searchProductId;
      const matchesLocation = !normalizedLocation || item.location_name.toLowerCase().includes(normalizedLocation);
      return matchesProduct && matchesLocation;
    });
  }, [searchLocation, searchProductId, supplierPrices]);

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Supplier Management</h1>
          <p className="text-sm text-muted-foreground">Manage suppliers, location-based rates, and search the best supplier for a requested product.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{suppliers.length} suppliers</Badge>
          <Badge variant="outline">{supplierPrices.length} pricing records</Badge>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-accent" />
                Find Supplier For Product Request
              </CardTitle>
              <CardDescription>
                Search by product and location so admin can quickly see which supplier is available on the platform and at what price.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>Product</Label>
                  <Select value={searchProductId} onValueChange={setSearchProductId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={noSelectionValue}>None</SelectItem>
                      {products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name} ({product.sku})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} placeholder="Mumbai, Pune, Delhi..." />
                </div>
                <div className="flex items-end">
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm w-full">
                    {matchedSupplierResults.length} supplier match{matchedSupplierResults.length === 1 ? '' : 'es'}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {matchedSupplierResults.length > 0 ? matchedSupplierResults.map((item) => (
                  <Card key={item.id} className="border bg-muted/10">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{item.supplier?.name || 'Unknown supplier'}</p>
                          <p className="text-xs text-muted-foreground">{item.product?.name || 'Unknown product'} • {item.product?.sku || '—'}</p>
                        </div>
                        {item.is_preferred && <Badge className="bg-accent text-accent-foreground text-[10px]">Preferred</Badge>}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Location:</span> {item.location_name}</p>
                        <p><span className="text-muted-foreground">Price:</span> Rs. {Number(item.price).toFixed(2)}</p>
                        <p><span className="text-muted-foreground">MOQ:</span> {item.min_order_quantity}</p>
                        <p><span className="text-muted-foreground">Lead time:</span> {item.lead_time_days} days</p>
                        <p><span className="text-muted-foreground">Contact:</span> {item.supplier?.contact_person || '—'}</p>
                        <p><span className="text-muted-foreground">Phone:</span> {item.supplier?.phone || '—'}</p>
                        <p><span className="text-muted-foreground">Email:</span> {item.supplier?.email || '—'}</p>
                      </div>
                      {item.notes && <p className="text-xs text-muted-foreground border-t pt-2">{item.notes}</p>}
                    </CardContent>
                  </Card>
                )) : (
                  <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
                    No supplier matched the selected product and location.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_1.4fr]">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-accent" />
                  Add Supplier
                </CardTitle>
                <CardDescription>
                  Create and maintain supplier records separately from product management.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Supplier Name *</Label>
                  <Input value={supplierForm.name} onChange={e => setSupplierForm(f => ({ ...f, name: e.target.value }))} placeholder="ABC Traders" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Contact Person</Label>
                    <Input value={supplierForm.contact_person} onChange={e => setSupplierForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="Rahul Sharma" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={supplierForm.phone} onChange={e => setSupplierForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91..." />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Email</Label>
                    <Input value={supplierForm.email} onChange={e => setSupplierForm(f => ({ ...f, email: e.target.value }))} placeholder="supplier@example.com" />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={supplierForm.notes} onChange={e => setSupplierForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Coverage area, payment terms, contract notes..." />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={supplierForm.is_active} onCheckedChange={v => setSupplierForm(f => ({ ...f, is_active: v }))} />
                  <Label>Supplier is active</Label>
                </div>
                <Button onClick={handleSaveSupplier} disabled={savingSupplier} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-display">
                  {savingSupplier ? 'Saving...' : 'Add Supplier'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  {editingSupplierPriceId ? 'Edit Supplier Pricing' : 'Supplier Pricing By Location'}
                </CardTitle>
                <CardDescription>
                  Link a product to a supplier and store different prices by city, region, or warehouse location.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Product *</Label>
                    <Select value={supplierPriceForm.product_id} onValueChange={v => setSupplierPriceForm(f => ({ ...f, product_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name} ({product.sku})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Supplier *</Label>
                    <Select value={supplierPriceForm.supplier_id} onValueChange={v => setSupplierPriceForm(f => ({ ...f, supplier_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Location *</Label>
                    <Input value={supplierPriceForm.location_name} onChange={e => setSupplierPriceForm(f => ({ ...f, location_name: e.target.value }))} placeholder="Mumbai" />
                  </div>
                  <div>
                    <Label>Price (INR) *</Label>
                    <Input type="number" min="0" step="0.01" value={supplierPriceForm.price} onChange={e => setSupplierPriceForm(f => ({ ...f, price: e.target.value }))} placeholder="1250" />
                  </div>
                  <div>
                    <Label>Min Order Qty</Label>
                    <Input type="number" min="1" value={supplierPriceForm.min_order_quantity} onChange={e => setSupplierPriceForm(f => ({ ...f, min_order_quantity: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Lead Time (Days)</Label>
                    <Input type="number" min="0" value={supplierPriceForm.lead_time_days} onChange={e => setSupplierPriceForm(f => ({ ...f, lead_time_days: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Notes</Label>
                    <Input value={supplierPriceForm.notes} onChange={e => setSupplierPriceForm(f => ({ ...f, notes: e.target.value }))} placeholder="Warehouse stock, negotiated rate, local logistics..." />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={supplierPriceForm.is_preferred} onCheckedChange={v => setSupplierPriceForm(f => ({ ...f, is_preferred: v }))} />
                  <Label>Mark as preferred supplier</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveSupplierPrice} disabled={savingSupplierPrice || suppliers.length === 0 || products.length === 0} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-display">
                    {savingSupplierPrice ? 'Saving...' : editingSupplierPriceId ? 'Update Supplier Pricing' : 'Save Supplier Pricing'}
                  </Button>
                  {editingSupplierPriceId ? (
                    <Button type="button" variant="outline" onClick={cancelEditingSupplierPrice}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Existing Supplier Pricing</CardTitle>
              <CardDescription>
                Review product-to-supplier mappings and filter them by product.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full max-w-xs">
                <Label>Filter By Product</Label>
                <Select value={pricingProductFilter} onValueChange={setPricingProductFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={noSelectionValue}>None</SelectItem>
                    {products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b bg-muted/50">
                        <th className="p-3">Product</th>
                        <th className="p-3">Supplier</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">MOQ</th>
                        <th className="p-3">Lead Time</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSupplierPrices.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="p-3">
                            <div className="font-medium">{item.product?.name || 'Unknown product'}</div>
                            <div className="text-xs text-muted-foreground">{item.product?.sku || '—'}</div>
                          </td>
                          <td className="p-3">{item.supplier?.name || 'Unknown supplier'}</td>
                          <td className="p-3">{item.location_name}</td>
                          <td className="p-3">Rs. {Number(item.price).toFixed(2)}</td>
                          <td className="p-3">{item.min_order_quantity}</td>
                          <td className="p-3">{item.lead_time_days} days</td>
                          <td className="p-3">
                            {item.is_preferred ? <Badge className="bg-accent text-accent-foreground text-[10px]">Preferred</Badge> : <span className="text-muted-foreground">Standard</span>}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => startEditingSupplierPrice(item)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete supplier pricing?</AlertDialogTitle>
                                    <AlertDialogDescription>This supplier-to-product price mapping will be removed.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteSupplierPrice(item.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredSupplierPrices.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No supplier pricing records found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
