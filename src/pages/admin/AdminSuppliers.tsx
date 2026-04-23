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
import { slugifyCatalogValue } from '@/lib/catalog';

type Product = {
  id: string;
  name: string;
  sku: string;
};

type Supplier = {
  id: string;
  name: string;
  user_id: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
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
  supplier: { id: string; name: string; phone: string | null; email: string | null; contact_person: string | null; city: string | null; pincode: string | null } | null;
  product: { id: string; name: string; sku: string } | null;
};

type UserProfileOption = {
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
};

type SupplierSubmission = {
  id: string;
  supplier_id: string;
  created_product_id: string | null;
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
  supplier: { id: string; name: string; city: string | null; pincode: string | null } | null;
};

const emptySupplierForm = { name: '', contact_person: '', phone: '', email: '', address_line1: '', city: '', state: '', pincode: '', notes: '', is_active: true };
const emptySupplierPriceForm = { product_id: '', supplier_id: '', location_name: '', price: '', min_order_quantity: '1', lead_time_days: '0', notes: '', is_preferred: false };
const noSelectionValue = 'none';

export default function AdminSuppliers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [profiles, setProfiles] = useState<UserProfileOption[]>([]);
  const [supplierPrices, setSupplierPrices] = useState<SupplierPrice[]>([]);
  const [supplierSubmissions, setSupplierSubmissions] = useState<SupplierSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [savingSupplierPrice, setSavingSupplierPrice] = useState(false);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [supplierPriceForm, setSupplierPriceForm] = useState(emptySupplierPriceForm);
  const [pricingProductFilter, setPricingProductFilter] = useState(noSelectionValue);
  const [searchProductId, setSearchProductId] = useState(noSelectionValue);
  const [searchLocation, setSearchLocation] = useState('');
  const [editingSupplierPriceId, setEditingSupplierPriceId] = useState<string | null>(null);
  const [linkSupplierId, setLinkSupplierId] = useState('');
  const [linkUserId, setLinkUserId] = useState('');
  const [linkSearch, setLinkSearch] = useState('');
  const [linkingSupplier, setLinkingSupplier] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [updatingSubmissionId, setUpdatingSubmissionId] = useState<string | null>(null);

  const ensureMainCategory = async (name: string) => {
    const normalized = name.trim();
    if (!normalized) return null;

    const { data: existingRow, error: existingError } = await (supabase as any)
      .from('catalog_main_categories')
      .select('id, display_order')
      .ilike('name', normalized)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingRow) return existingRow.id as string;

    const { data: lastRow } = await (supabase as any)
      .from('catalog_main_categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: createdRow, error: createError } = await (supabase as any)
      .from('catalog_main_categories')
      .insert({
        name: normalized,
        slug: slugifyCatalogValue(normalized),
        description: '',
        image_url: '',
        display_order: Number(lastRow?.display_order || 0) + 10,
        is_active: true,
      })
      .select('id')
      .single();

    if (createError) throw createError;
    return createdRow.id as string;
  };

  const ensureSubcategory = async (mainCategoryId: string | null, name: string, legacyCategoryName: string) => {
    const normalized = name.trim();
    if (!mainCategoryId || !normalized) return null;

    const { data: existingRow, error: existingError } = await (supabase as any)
      .from('catalog_subcategories')
      .select('id, display_order')
      .eq('main_category_id', mainCategoryId)
      .ilike('name', normalized)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingRow) return existingRow.id as string;

    const { data: lastRow } = await (supabase as any)
      .from('catalog_subcategories')
      .select('display_order')
      .eq('main_category_id', mainCategoryId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: createdRow, error: createError } = await (supabase as any)
      .from('catalog_subcategories')
      .insert({
        main_category_id: mainCategoryId,
        name: normalized,
        slug: slugifyCatalogValue(normalized),
        image_url: '',
        description: '',
        legacy_category_name: legacyCategoryName || normalized,
        display_order: Number(lastRow?.display_order || 0) + 10,
        is_active: true,
      })
      .select('id')
      .single();

    if (createError) throw createError;
    return createdRow.id as string;
  };

  const ensureLegacyCategory = async (name: string) => {
    const normalized = name.trim();
    if (!normalized) return '';

    const { data: existingRow, error: existingError } = await (supabase as any)
      .from('categories')
      .select('id')
      .ilike('name', normalized)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingRow) return normalized;

    const { data: lastRow } = await (supabase as any)
      .from('categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error: createError } = await (supabase as any)
      .from('categories')
      .insert({
        name: normalized,
        icon: '',
        display_order: Number(lastRow?.display_order || 0) + 10,
      });

    if (createError) throw createError;
    return normalized;
  };

  const createCatalogProductFromSubmission = async (submission: SupplierSubmission) => {
    if (submission.created_product_id) return submission.created_product_id;

    const mainCategoryName = submission.requested_main_category.trim();
    const subcategoryName = submission.requested_subcategory.trim();
    const legacyCategoryName = (subcategoryName || mainCategoryName || 'Supplier Products').trim();

    const mainCategoryId = await ensureMainCategory(mainCategoryName || legacyCategoryName);
    const subcategoryId = await ensureSubcategory(mainCategoryId, subcategoryName, legacyCategoryName);
    const categoryName = await ensureLegacyCategory(legacyCategoryName);

    const skuBase = slugifyCatalogValue(submission.product_name).replace(/-/g, '').toUpperCase().slice(0, 8) || 'SUPPLY';
    const sku = `${skuBase}-${String(Date.now()).slice(-6)}`;

    const { data: productRow, error: productError } = await (supabase as any)
      .from('products')
      .insert({
        name: submission.product_name.trim(),
        description: submission.product_description?.trim() || '',
        category: categoryName,
        main_category_id: mainCategoryId,
        subcategory_id: subcategoryId,
        company_id: null,
        company_name: submission.supplier?.name || 'Supplier',
        unit: submission.unit?.trim() || 'unit',
        sku,
        image_url: submission.image_url || null,
        image_source: submission.image_url ? submission.image_source || 'manual_url' : 'none',
        is_popular: false,
        is_new: true,
      })
      .select('id')
      .single();

    if (productError) throw productError;
    return productRow.id as string;
  };

  const fetchData = async () => {
    setLoading(true);
    const [productRes, supplierRes, supplierPriceRes, profileRes, submissionRes] = await Promise.all([
      supabase.from('products').select('id, name, sku').order('name'),
      supabase.from('suppliers').select('*').order('name'),
      supabase
        .from('supplier_product_prices')
        .select('id, product_id, supplier_id, location_name, price, lead_time_days, min_order_quantity, notes, is_preferred, suppliers(id, name, phone, email, contact_person, city, pincode), products(id, name, sku)')
        .order('is_preferred', { ascending: false })
        .order('price', { ascending: true }),
      (supabase as any).from('profiles').select('user_id, full_name, email, phone').order('full_name'),
      (supabase as any)
        .from('supplier_product_submissions')
        .select('id, supplier_id, created_product_id, requested_main_category, requested_subcategory, product_name, product_description, unit, proposed_price, min_order_quantity, lead_time_days, notes, image_url, image_source, status, admin_review_notes, suppliers(id, name, city, pincode)')
        .order('created_at', { ascending: false }),
    ]);

    setProducts(productRes.data || []);
    setSuppliers(supplierRes.data || []);
    setProfiles((profileRes.data || []) as UserProfileOption[]);
    setSupplierPrices((supplierPriceRes.data || []).map((item: any) => ({
      ...item,
      supplier: item.suppliers,
      product: item.products,
    })));
    setSupplierSubmissions((submissionRes.data || []).map((item: any) => ({
      ...item,
      supplier: item.suppliers,
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
      address_line1: supplierForm.address_line1.trim() || null,
      city: supplierForm.city.trim() || null,
      state: supplierForm.state.trim() || null,
      pincode: supplierForm.pincode.trim() || null,
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

  const unlinkedSuppliers = useMemo(
    () => suppliers.filter((supplier) => !supplier.user_id),
    [suppliers],
  );

  const filteredProfiles = useMemo(() => {
    const term = linkSearch.trim().toLowerCase();
    if (!term) return profiles;

    return profiles.filter((profile) =>
      profile.full_name.toLowerCase().includes(term) ||
      profile.email?.toLowerCase().includes(term) ||
      profile.phone?.toLowerCase().includes(term),
    );
  }, [linkSearch, profiles]);

  const handleLinkSupplier = async () => {
    if (!linkSupplierId || !linkUserId) {
      toast.error('Select both supplier and user account');
      return;
    }

    setLinkingSupplier(true);

    const { error: supplierError } = await (supabase as any)
      .from('suppliers')
      .update({ user_id: linkUserId, is_active: true })
      .eq('id', linkSupplierId);

    if (supplierError) {
      toast.error(supplierError.message || 'Failed to link supplier');
      setLinkingSupplier(false);
      return;
    }

    const { error: roleError } = await (supabase as any)
      .from('user_roles')
      .upsert({ user_id: linkUserId, role: 'supplier' }, { onConflict: 'user_id,role' });

    if (roleError) {
      toast.error(roleError.message || 'Failed to grant supplier role');
      setLinkingSupplier(false);
      return;
    }

    await (supabase as any)
      .from('notifications')
      .insert({ user_id: linkUserId, message: 'Your supplier account has been linked by admin. You can now open the Supplier Panel and list your products.' });

    toast.success('Supplier linked to user account');
    setLinkSupplierId('');
    setLinkUserId('');
    setLinkSearch('');
    setLinkingSupplier(false);
    fetchData();
  };

  const updateSubmissionStatus = async (submission: SupplierSubmission, status: SupplierSubmission['status']) => {
    setUpdatingSubmissionId(submission.id);

    try {
      const updatePayload: Record<string, unknown> = {
        status,
        admin_review_notes: reviewNotes[submission.id]?.trim() || submission.admin_review_notes || null,
      };

      if (status === 'approved') {
        updatePayload.created_product_id = await createCatalogProductFromSubmission(submission);
      }

      const { error } = await (supabase as any)
        .from('supplier_product_submissions')
        .update(updatePayload)
        .eq('id', submission.id);

      setUpdatingSubmissionId(null);

      if (error) {
        toast.error(error.message || 'Failed to update submission');
        return;
      }

      toast.success(status === 'approved' ? 'Submission approved and product created' : `Submission marked ${status}`);
      fetchData();
    } catch (error: any) {
      setUpdatingSubmissionId(null);
      toast.error(error.message || 'Failed to create catalog product from submission');
    }
  };

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
                        <p><span className="text-muted-foreground">Supplier City:</span> {(item as any).supplier?.city || '—'}</p>
                        <p><span className="text-muted-foreground">Postal Code:</span> {(item as any).supplier?.pincode || '—'}</p>
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
                <CardTitle className="font-display text-lg">Link Supplier Portal Access</CardTitle>
                <CardDescription>
                  Use this when a supplier was approved without logging in. Link the supplier record to an existing website user account by email, phone, or name.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Supplier Without Portal Access</Label>
                  <Select value={linkSupplierId} onValueChange={setLinkSupplierId}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {unlinkedSuppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name} {supplier.city ? `(${supplier.city})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Search User Account</Label>
                  <Input value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} placeholder="Search by name, email, or phone" />
                </div>
                <div>
                  <Label>User Account</Label>
                  <Select value={linkUserId} onValueChange={setLinkUserId}>
                    <SelectTrigger><SelectValue placeholder="Select user account" /></SelectTrigger>
                    <SelectContent>
                      {filteredProfiles.slice(0, 50).map((profile) => (
                        <SelectItem key={profile.user_id} value={profile.user_id}>
                          {profile.full_name} {profile.email ? `• ${profile.email}` : profile.phone ? `• ${profile.phone}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleLinkSupplier} disabled={linkingSupplier || unlinkedSuppliers.length === 0} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-display">
                  {linkingSupplier ? 'Linking...' : 'Enable Supplier Portal'}
                </Button>
              </CardContent>
            </Card>

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
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Input value={supplierForm.address_line1} onChange={e => setSupplierForm(f => ({ ...f, address_line1: e.target.value }))} placeholder="Warehouse no, street, area" />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={supplierForm.city} onChange={e => setSupplierForm(f => ({ ...f, city: e.target.value }))} placeholder="Mumbai" />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={supplierForm.state} onChange={e => setSupplierForm(f => ({ ...f, state: e.target.value }))} placeholder="Maharashtra" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Postal Code</Label>
                    <Input value={supplierForm.pincode} onChange={e => setSupplierForm(f => ({ ...f, pincode: e.target.value }))} placeholder="400001" />
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

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {suppliers.map((supplier) => (
                  <Card key={supplier.id} className="border bg-muted/10">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-xs text-muted-foreground">{supplier.contact_person || supplier.phone || 'No contact added'}</p>
                        </div>
                        <Badge variant={supplier.is_active ? 'secondary' : 'outline'}>{supplier.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">City:</span> {supplier.city || '—'}</p>
                        <p><span className="text-muted-foreground">Postal Code:</span> {supplier.pincode || '—'}</p>
                        <p><span className="text-muted-foreground">Address:</span> {supplier.address_line1 || '—'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">New Product / Category Requests</CardTitle>
              <CardDescription>
                Review products submitted by suppliers when the item or category does not yet exist in the catalog.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {supplierSubmissions.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  No supplier product requests found.
                </div>
              ) : supplierSubmissions.map((submission) => (
                <Card key={submission.id} className="border bg-muted/10">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-medium">{submission.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[submission.requested_main_category, submission.requested_subcategory].filter(Boolean).join(' / ') || 'Uncategorized'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supplier: {submission.supplier?.name || 'Unknown'} {submission.supplier?.city ? `• ${submission.supplier.city}` : ''} {submission.supplier?.pincode ? `• ${submission.supplier.pincode}` : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">{submission.status}</Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                      <div className="space-y-1 text-sm">
                        {submission.product_description ? <p>{submission.product_description}</p> : null}
                        <p><span className="text-muted-foreground">Proposed Price:</span> {submission.proposed_price != null ? `Rs. ${Number(submission.proposed_price).toFixed(2)}` : '—'}</p>
                        <p><span className="text-muted-foreground">MOQ:</span> {submission.min_order_quantity}</p>
                        <p><span className="text-muted-foreground">Lead Time:</span> {submission.lead_time_days} days</p>
                        <p><span className="text-muted-foreground">Unit:</span> {submission.unit || '—'}</p>
                        {submission.notes ? <p><span className="text-muted-foreground">Supplier Notes:</span> {submission.notes}</p> : null}
                        {submission.created_product_id ? <p><span className="text-muted-foreground">Catalog Product:</span> Created</p> : null}
                      </div>
                      {submission.image_url ? (
                        <img src={submission.image_url} alt={submission.product_name} className="h-36 w-full rounded-md border object-cover bg-muted/20" />
                      ) : (
                        <div className="h-36 rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground">No image</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Admin Review Notes</Label>
                      <Textarea
                        rows={2}
                        value={reviewNotes[submission.id] ?? submission.admin_review_notes ?? ''}
                        onChange={(event) => setReviewNotes((prev) => ({ ...prev, [submission.id]: event.target.value }))}
                        placeholder="Catalog mapping, follow-up details, approval notes"
                      />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" disabled={updatingSubmissionId === submission.id} onClick={() => updateSubmissionStatus(submission, 'reviewed')}>
                        Mark Reviewed
                      </Button>
                      <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={updatingSubmissionId === submission.id} onClick={() => updateSubmissionStatus(submission, 'approved')}>
                        Approve Request
                      </Button>
                      <Button size="sm" variant="outline" disabled={updatingSubmissionId === submission.id} onClick={() => updateSubmissionStatus(submission, 'rejected')}>
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
