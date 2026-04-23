import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ImagePlus, Link2, MapPin, Pencil, Trash2, Upload, Camera } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  sku: string;
};

type SupplierProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  address_line1: string | null;
};

type SupplierPrice = {
  id: string;
  product_id: string;
  price: number;
  min_order_quantity: number;
  lead_time_days: number;
  notes: string | null;
  is_preferred: boolean;
  product: Product | null;
};

type SupplierProductSubmission = {
  id: string;
  requested_main_category: string;
  requested_subcategory: string;
  product_name: string;
  product_description: string | null;
  unit: string;
  proposed_price: number | null;
  min_order_quantity: number;
  lead_time_days: number;
  notes: string | null;
  image_url: string | null;
  image_source: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  admin_review_notes: string | null;
};

const emptyForm = {
  product_id: '',
  price: '',
  min_order_quantity: '1',
  lead_time_days: '0',
  notes: '',
};

const emptySubmissionForm = {
  requested_main_category: '',
  requested_subcategory: '',
  product_name: '',
  product_description: '',
  unit: '',
  proposed_price: '',
  min_order_quantity: '1',
  lead_time_days: '0',
  notes: '',
  image_url: '',
};

export default function SupplierDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSubmission, setSavingSubmission] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [prices, setPrices] = useState<SupplierPrice[]>([]);
  const [submissions, setSubmissions] = useState<SupplierProductSubmission[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [submissionForm, setSubmissionForm] = useState(emptySubmissionForm);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const locationName = useMemo(() => {
    if (!supplier) return '';
    return [supplier.city, supplier.pincode].filter(Boolean).join(' - ');
  }, [supplier]);

  const load = async () => {
    if (!user) return;

    setLoading(true);
    const [{ data: supplierRow }, { data: productRows }] = await Promise.all([
      (supabase as any).from('suppliers').select('id, name, email, phone, city, state, pincode, address_line1').eq('user_id', user.id).maybeSingle(),
      supabase.from('products').select('id, name, sku').order('name'),
    ]);

    setProducts(productRows || []);
    setSupplier((supplierRow as SupplierProfile | null) ?? null);

    if (supplierRow?.id) {
      const [{ data: priceRows }, { data: submissionRows }] = await Promise.all([
        (supabase as any)
          .from('supplier_product_prices')
          .select('id, product_id, price, min_order_quantity, lead_time_days, notes, is_preferred, products(id, name, sku)')
          .eq('supplier_id', supplierRow.id)
          .order('updated_at', { ascending: false }),
        (supabase as any)
          .from('supplier_product_submissions')
          .select('*')
          .eq('supplier_id', supplierRow.id)
          .order('created_at', { ascending: false }),
      ]);

      setPrices((priceRows || []).map((item: any) => ({
        ...item,
        product: item.products,
      })));
      setSubmissions((submissionRows || []) as SupplierProductSubmission[]);
    } else {
      setPrices([]);
      setSubmissions([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingPriceId(null);
  };

  const resetSubmissionForm = () => setSubmissionForm(emptySubmissionForm);

  const uploadSubmissionImage = async (file: File) => {
    if (!user) throw new Error('User not found');

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage.from('supplier-product-images').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) throw error;

    const { data } = supabase.storage.from('supplier-product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImageFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSavingSubmission(true);
      const publicUrl = await uploadSubmissionImage(file);
      setSubmissionForm((prev) => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setSavingSubmission(false);
      event.target.value = '';
    }
  };

  const savePrice = async () => {
    if (!supplier) {
      toast.error('Supplier profile is not linked yet');
      return;
    }

    if (!form.product_id || !form.price.trim()) {
      toast.error('Product and price are required');
      return;
    }

    setSaving(true);
    const payload = {
      supplier_id: supplier.id,
      product_id: form.product_id,
      location_name: locationName || supplier.city || 'Supplier location',
      price: Number(form.price),
      min_order_quantity: Math.max(1, Number(form.min_order_quantity) || 1),
      lead_time_days: Math.max(0, Number(form.lead_time_days) || 0),
      notes: form.notes.trim() || null,
    };

    const query = editingPriceId
      ? (supabase as any).from('supplier_product_prices').update(payload).eq('id', editingPriceId)
      : (supabase as any).from('supplier_product_prices').insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      toast.error(error.message || 'Failed to save product pricing');
      return;
    }

    toast.success(editingPriceId ? 'Product pricing updated' : 'Product added for admin review');
    resetForm();
    load();
  };

  const startEdit = (item: SupplierPrice) => {
    setEditingPriceId(item.id);
    setForm({
      product_id: item.product_id,
      price: String(item.price),
      min_order_quantity: String(item.min_order_quantity),
      lead_time_days: String(item.lead_time_days),
      notes: item.notes || '',
    });
  };

  const deletePrice = async (id: string) => {
    const { error } = await (supabase as any).from('supplier_product_prices').delete().eq('id', id);
    if (error) {
      toast.error(error.message || 'Failed to delete product pricing');
      return;
    }

    toast.success('Product pricing removed');
    if (editingPriceId === id) resetForm();
    load();
  };

  const saveSubmission = async () => {
    if (!supplier) {
      toast.error('Supplier profile is not linked yet');
      return;
    }

    if (!submissionForm.requested_main_category.trim() || !submissionForm.product_name.trim()) {
      toast.error('Category and product name are required');
      return;
    }

    setSavingSubmission(true);
    const { error } = await (supabase as any).from('supplier_product_submissions').insert({
      supplier_id: supplier.id,
      requested_main_category: submissionForm.requested_main_category.trim(),
      requested_subcategory: submissionForm.requested_subcategory.trim() || '',
      product_name: submissionForm.product_name.trim(),
      product_description: submissionForm.product_description.trim() || null,
      unit: submissionForm.unit.trim() || 'unit',
      proposed_price: submissionForm.proposed_price.trim() ? Number(submissionForm.proposed_price) : null,
      min_order_quantity: Math.max(1, Number(submissionForm.min_order_quantity) || 1),
      lead_time_days: Math.max(0, Number(submissionForm.lead_time_days) || 0),
      notes: submissionForm.notes.trim() || null,
      image_url: submissionForm.image_url.trim() || null,
      image_source: submissionForm.image_url.trim()
        ? submissionForm.image_url.includes('supplier-product-images')
          ? 'uploaded'
          : 'link'
        : 'none',
    });

    setSavingSubmission(false);

    if (error) {
      toast.error(error.message || 'Failed to submit new product request');
      return;
    }

    toast.success('New product/category request submitted for admin review');
    resetSubmissionForm();
    load();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Supplier account not linked</CardTitle>
          <CardDescription>Your supplier application has not been approved and linked to this login yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Supplier Portal</h1>
          <p className="text-sm text-muted-foreground">Manage your approved product list. Pricing stays internal to the admin procurement team.</p>
        </div>
        <Badge variant="secondary">{prices.length} listed product{prices.length === 1 ? '' : 's'}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            Registered Supplier Location
          </CardTitle>
          <CardDescription>This address is captured once during approval and used for procurement and serviceability decisions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Supplier</p>
            <p className="font-medium">{supplier.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Contact</p>
            <p className="font-medium">{supplier.phone || supplier.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">City / Postal Code</p>
            <p className="font-medium">{[supplier.city, supplier.pincode].filter(Boolean).join(' - ') || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">State</p>
            <p className="font-medium">{supplier.state || '—'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="font-medium">{supplier.address_line1 || '—'}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">{editingPriceId ? 'Edit Product Listing' : 'Add Product Listing'}</CardTitle>
            <CardDescription>Choose a product and submit your supply price for admin procurement visibility.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={form.product_id} onValueChange={(value) => setForm((prev) => ({ ...prev, product_id: value }))}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Price (INR)</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} />
              </div>
              <div>
                <Label>Minimum Order Qty</Label>
                <Input type="number" min="1" value={form.min_order_quantity} onChange={(event) => setForm((prev) => ({ ...prev, min_order_quantity: event.target.value }))} />
              </div>
              <div>
                <Label>Lead Time (Days)</Label>
                <Input type="number" min="0" value={form.lead_time_days} onChange={(event) => setForm((prev) => ({ ...prev, lead_time_days: event.target.value }))} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={locationName} readOnly className="bg-muted/40" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Stock note, delivery note, brand note" />
            </div>
            <div className="flex gap-2">
              <Button onClick={savePrice} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {saving ? 'Saving...' : editingPriceId ? 'Update Listing' : 'Add Listing'}
              </Button>
              {editingPriceId ? (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Submitted Products</CardTitle>
            <CardDescription>These prices are visible to the admin procurement team only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prices.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                No products listed yet.
              </div>
            ) : prices.map((item) => (
              <div key={item.id} className="rounded-md border p-4 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">{item.product?.name || 'Unknown product'}</p>
                  <p className="text-xs text-muted-foreground">{item.product?.sku || '—'}</p>
                  <p className="text-sm">Price: Rs. {Number(item.price).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">MOQ {item.min_order_quantity} • Lead time {item.lead_time_days} days</p>
                  {item.notes ? <p className="text-xs text-muted-foreground">{item.notes}</p> : null}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this product listing?</AlertDialogTitle>
                        <AlertDialogDescription>The admin team will no longer see this product-price entry.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletePrice(item.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-accent" />
              Request New Product Or Category
            </CardTitle>
            <CardDescription>If your product does not exist in our catalog, submit it here with category details, price, and image.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Main Category</Label>
                <Input value={submissionForm.requested_main_category} onChange={(event) => setSubmissionForm((prev) => ({ ...prev, requested_main_category: event.target.value }))} placeholder="Electricals, Fasteners, Plumbing" />
              </div>
              <div>
                <Label>Subcategory</Label>
                <Input value={submissionForm.requested_subcategory} onChange={(event) => setSubmissionForm((prev) => ({ ...prev, requested_subcategory: event.target.value }))} placeholder="Wires, Valves, Anchors" />
              </div>
              <div className="md:col-span-2">
                <Label>Product Name</Label>
                <Input value={submissionForm.product_name} onChange={(event) => setSubmissionForm((prev) => ({ ...prev, product_name: event.target.value }))} placeholder="Copper Lug 25mm, Safety Helmet, Cutting Wheel" />
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea value={submissionForm.product_description} onChange={(event) => setSubmissionForm((prev) => ({ ...prev, product_description: event.target.value }))} rows={3} placeholder="Brand, size, material, pack details" />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={submissionForm.unit} onChange={(event) => setSubmissionForm((prev) => ({ ...prev, unit: event.target.value }))} placeholder="pcs, box, kg, roll" />
              </div>
              <div>
                <Label>Proposed Price (INR)</Label>
                <Input type="number" min="0" step="0.01" value={submissionForm.proposed_price} onChange={(event) => setSubmissionForm((prev) => ({ ...prev, proposed_price: event.target.value }))} />
              </div>
              <div>
                <Label>MOQ</Label>
                <Input type="number" min="1" value={submissionForm.min_order_quantity} onChange={(event) => setSubmissionForm((prev) => ({ ...prev, min_order_quantity: event.target.value }))} />
              </div>
              <div>
                <Label>Lead Time (Days)</Label>
                <Input type="number" min="0" value={submissionForm.lead_time_days} onChange={(event) => setSubmissionForm((prev) => ({ ...prev, lead_time_days: event.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <Input value={submissionForm.notes} onChange={(event) => setSubmissionForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Alternate brands, stock quantity, supply region" />
              </div>
              <div className="md:col-span-2">
                <Label>Image Link</Label>
                <div className="flex gap-2">
                  <Input value={submissionForm.image_url} onChange={(event) => setSubmissionForm((prev) => ({ ...prev, image_url: event.target.value }))} placeholder="https://..." />
                  <Button type="button" variant="outline" size="icon" onClick={() => galleryInputRef.current?.click()}>
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={() => cameraInputRef.current?.click()}>
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Link2 className="w-3 h-3" /> Paste image link</span>
                  <span className="inline-flex items-center gap-1"><Upload className="w-3 h-3" /> Upload from gallery</span>
                  <span className="inline-flex items-center gap-1"><Camera className="w-3 h-3" /> Capture from camera</span>
                </div>
                <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileSelect} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageFileSelect} />
              </div>
              {submissionForm.image_url ? (
                <div className="md:col-span-2">
                  <img src={submissionForm.image_url} alt="Submission preview" className="h-40 w-full rounded-md border object-contain bg-muted/30" />
                </div>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button onClick={saveSubmission} disabled={savingSubmission} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {savingSubmission ? 'Submitting...' : 'Submit New Product Request'}
              </Button>
              <Button variant="outline" onClick={resetSubmissionForm}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">New Product Requests</CardTitle>
            <CardDescription>Track brand-new product/category requests that are waiting for admin review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {submissions.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                No new catalog requests submitted yet.
              </div>
            ) : submissions.map((item) => (
              <div key={item.id} className="rounded-md border p-4 flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{item.product_name}</p>
                    <Badge variant="outline" className="capitalize">{item.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{[item.requested_main_category, item.requested_subcategory].filter(Boolean).join(' / ') || 'Uncategorized'}</p>
                  {item.product_description ? <p className="text-sm text-muted-foreground">{item.product_description}</p> : null}
                  <p className="text-sm">Price: {item.proposed_price != null ? `Rs. ${Number(item.proposed_price).toFixed(2)}` : 'Not provided'}</p>
                  <p className="text-sm text-muted-foreground">MOQ {item.min_order_quantity} • Lead time {item.lead_time_days} days • Unit {item.unit || '—'}</p>
                  {item.notes ? <p className="text-xs text-muted-foreground">{item.notes}</p> : null}
                  {item.admin_review_notes ? <p className="text-xs text-muted-foreground">Admin: {item.admin_review_notes}</p> : null}
                </div>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.product_name} className="h-20 w-20 shrink-0 rounded-md border object-cover" />
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
