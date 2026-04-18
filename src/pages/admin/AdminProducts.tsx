import { useEffect, useState, type ChangeEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { importProductsFromRows, parseProductsExcel, type ProductImportPreviewRow } from '@/lib/productBulkImport';
import type { CatalogMainCategory, CatalogSubcategory } from '@/lib/catalog';

type Product = {
  id: string; name: string; description: string; category: string;
  main_category_id: string | null;
  subcategory_id: string | null;
  company_id: string | null;
  company_name: string;
  unit: string; sku: string; image_url: string | null; image_source: string; is_popular: boolean | null;
  is_new: boolean | null; created_at: string;
};

type Company = {
  id: string;
  name: string;
};

const units = ['per piece', 'per box', 'per kg', 'per meter', 'per litre', 'per set', 'per bag', 'per roll', 'per pair', 'per can'];

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [mainCategories, setMainCategories] = useState<CatalogMainCategory[]>([]);
  const [subcategories, setSubcategories] = useState<CatalogSubcategory[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [importRows, setImportRows] = useState<ProductImportPreviewRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const emptyForm = {
    name: '',
    description: '',
    category: '',
    main_category_id: '',
    subcategory_id: '',
    company_id: '',
    company_name: '',
    unit: 'per piece',
    sku: '',
    image_url: '',
    is_popular: false,
    is_new: false,
  };
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    const [prodRes, catRes, mainCatRes, subCatRes, companyRes] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('categories').select('name').order('display_order'),
      supabase.from('catalog_main_categories').select('*').eq('is_active', true).order('display_order'),
      supabase.from('catalog_subcategories').select('*').eq('is_active', true).order('display_order'),
      supabase.from('companies').select('id, name').order('name'),
    ]);
    setProducts(prodRes.data || []);
    setCategories((catRes.data || []).map((category) => category.name));
    setMainCategories((mainCatRes.data || []) as CatalogMainCategory[]);
    setSubcategories((subCatRes.data || []) as CatalogSubcategory[]);
    setCompanies(companyRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      category: p.category,
      main_category_id: p.main_category_id || '',
      subcategory_id: p.subcategory_id || '',
      company_id: p.company_id || '',
      company_name: p.company_name,
      unit: p.unit,
      sku: p.sku,
      image_url: p.image_url || '',
      is_popular: !!p.is_popular,
      is_new: !!p.is_new,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.company_name || !form.sku) { toast.error('Name, category, company, and SKU are required'); return; }
    setSaving(true);
    const payload = {
      ...form,
      main_category_id: form.main_category_id || null,
      subcategory_id: form.subcategory_id || null,
      company_id: form.company_id || null,
      image_source: form.image_url.trim() ? 'manual_url' : 'none',
    };
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) toast.error('Failed to update product'); else toast.success('Product updated');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) toast.error('Failed to add product'); else toast.success('Product added');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Product deleted'); fetchData(); }
  };

  const resetImportState = () => {
    setSelectedFileName('');
    setImportRows([]);
    setImportErrors([]);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const result = await parseProductsExcel(file);
      setSelectedFileName(file.name);
      setImportRows(result.rows);
      setImportErrors(result.errors);

      if (result.rows.length === 0) {
        toast.error('No valid rows found in the file');
      } else if (result.errors.length > 0) {
        toast.warning(`Loaded ${result.rows.length} rows with ${result.errors.length} issues to review`);
      } else {
        toast.success(`Loaded ${result.rows.length} rows from ${file.name}`);
      }
    } catch (error) {
      console.error(error);
      resetImportState();
      toast.error('Failed to read the Excel file');
    } finally {
      event.target.value = '';
    }
  };

  const handleBulkImport = async () => {
    if (importRows.length === 0) {
      toast.error('Upload a valid Excel file first');
      return;
    }

    setImporting(true);

    try {
      const result = await importProductsFromRows(supabase, importRows);
      toast.success(`Imported ${result.importedProducts} products${result.createdCategories ? ` and created ${result.createdCategories} categories` : ''}`);
      resetImportState();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  const filtered = products.filter(p => {
    if (catFilter !== 'All' && p.category !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase()) && !p.company_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const subcategoryOptions = subcategories.filter((subcategory) => subcategory.main_category_id === form.main_category_id);
  const mainCategoryMap = Object.fromEntries(mainCategories.map((category) => [category.id, category.name]));
  const subcategoryMap = Object.fromEntries(subcategories.map((subcategory) => [subcategory.id, subcategory.name]));

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold">Manage Products</h1>
        <Button onClick={openNew} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-accent" />
                Bulk Upload From Excel
              </CardTitle>
              <CardDescription className="mt-1">
                Upload one `.xlsx` or `.csv` file with columns: `name`, `sku`, `company_name`, `main_category`, `subcategory`, `category`, `description`, `unit`, `image_url`, `is_new`, `is_popular`.
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="max-w-[280px]"
              />
              <Button
                onClick={handleBulkImport}
                disabled={importing || importRows.length === 0}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-display"
              >
                <Upload className="w-4 h-4 mr-2" />
                {importing ? 'Importing...' : 'Import Products'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {selectedFileName ? `Selected file: ${selectedFileName}` : 'No file selected yet.'}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">{importRows.length} valid rows</Badge>
            <Badge variant={importErrors.length > 0 ? 'destructive' : 'outline'}>
              {importErrors.length} errors
            </Badge>
            <Badge variant="outline">Missing leaf categories will be created automatically</Badge>
            <Badge variant="outline">Main category and subcategory must already exist in admin catalog</Badge>
            <Badge variant="outline">Existing SKUs will be updated</Badge>
          </div>

          {importErrors.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm font-medium text-destructive mb-2">Rows with issues</p>
              <div className="space-y-1 text-sm text-muted-foreground max-h-40 overflow-auto">
                {importErrors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            </div>
          )}

          {importRows.length > 0 && (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b bg-muted/50">
                      <th className="p-3">Row</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 8).map((row) => (
                      <tr key={`${row.sku}-${row.rowNumber}`} className="border-b last:border-0">
                        <td className="p-3 text-muted-foreground">{row.rowNumber}</td>
                        <td className="p-3 font-medium">{row.name}</td>
                        <td className="p-3 text-muted-foreground">{row.sku}</td>
                        <td className="p-3">{row.category}</td>
                        <td className="p-3">{row.unit}</td>
                        <td className="p-3 space-x-1">
                          {row.is_new && <Badge className="bg-accent text-accent-foreground text-[10px]">New</Badge>}
                          {row.is_popular && <Badge variant="secondary" className="text-[10px]">Popular</Badge>}
                          {!row.is_new && !row.is_popular && <span className="text-muted-foreground">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importRows.length > 8 && (
                <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                  Showing 8 of {importRows.length} rows in preview.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground border-b bg-muted/50">
                  <th className="p-3">Name</th><th className="p-3">SKU</th><th className="p-3">Company</th><th className="p-3">Main</th><th className="p-3">Subcategory</th><th className="p-3">Category</th><th className="p-3">Unit</th><th className="p-3">Flags</th><th className="p-3 text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-muted-foreground">{p.sku}</td>
                      <td className="p-3">{p.company_name}</td>
                      <td className="p-3 text-muted-foreground">{p.main_category_id ? mainCategoryMap[p.main_category_id] || '-' : '-'}</td>
                      <td className="p-3 text-muted-foreground">{p.subcategory_id ? subcategoryMap[p.subcategory_id] || '-' : '-'}</td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3">{p.unit}</td>
                      <td className="p-3 space-x-1">
                        {p.is_new && <Badge className="bg-accent text-accent-foreground text-[10px]">New</Badge>}
                        {p.is_popular && <Badge variant="secondary" className="text-[10px]">Popular</Badge>}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete {p.name}?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No products found.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{editing ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[80vh] space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>SKU *</Label><Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} /></div>
            <div><Label>Company *</Label>
              <Select
                value={form.company_id || 'manual'}
                onValueChange={(value) => {
                  if (value === 'manual') {
                    setForm(f => ({ ...f, company_id: '', company_name: '' }));
                    return;
                  }
                  const company = companies.find((item) => item.id === value);
                  setForm(f => ({ ...f, company_id: value, company_name: company?.name || f.company_name }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                  {companies.map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Company Name *</Label><Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value, company_id: '' }))} placeholder="Asian Paints" /></div>
            <div><Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Main Category</Label>
              <Select value={form.main_category_id || '__none__'} onValueChange={v => setForm(f => ({ ...f, main_category_id: v === '__none__' ? '' : v, subcategory_id: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select main category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {mainCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Subcategory</Label>
              <Select value={form.subcategory_id || '__none__'} onValueChange={v => setForm(f => ({ ...f, subcategory_id: v === '__none__' ? '' : v }))} disabled={!form.main_category_id}>
                <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {subcategoryOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Unit</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.is_new} onCheckedChange={v => setForm(f => ({ ...f, is_new: v }))} /><Label>New</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_popular} onCheckedChange={v => setForm(f => ({ ...f, is_popular: v }))} /><Label>Popular</Label></div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-display">
              {saving ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
