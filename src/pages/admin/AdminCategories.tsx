import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { CatalogMainCategory, CatalogSubcategory } from '@/lib/catalog';
import { slugifyCatalogValue } from '@/lib/catalog';

type LegacyCategory = {
  id: string;
  name: string;
  icon: string | null;
  display_order: number | null;
  created_at: string;
};

type MainCategoryForm = {
  name: string;
  slug: string;
  image_url: string;
  description: string;
  display_order: number;
};

type SubcategoryForm = {
  main_category_id: string;
  name: string;
  slug: string;
  image_url: string;
  description: string;
  legacy_category_name: string;
  display_order: number;
};

type LegacyCategoryForm = {
  name: string;
  icon: string;
  display_order: number;
};

const emptyMainCategoryForm: MainCategoryForm = {
  name: '',
  slug: '',
  image_url: '',
  description: '',
  display_order: 10,
};

const emptySubcategoryForm: SubcategoryForm = {
  main_category_id: '',
  name: '',
  slug: '',
  image_url: '',
  description: '',
  legacy_category_name: '',
  display_order: 10,
};

const emptyLegacyCategoryForm: LegacyCategoryForm = {
  name: '',
  icon: '',
  display_order: 10,
};

export default function AdminCategories() {
  const [mainCategories, setMainCategories] = useState<CatalogMainCategory[]>([]);
  const [subcategories, setSubcategories] = useState<CatalogSubcategory[]>([]);
  const [legacyCategories, setLegacyCategories] = useState<LegacyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('main');

  const [mainDialogOpen, setMainDialogOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [legacyDialogOpen, setLegacyDialogOpen] = useState(false);

  const [editingMain, setEditingMain] = useState<CatalogMainCategory | null>(null);
  const [editingSub, setEditingSub] = useState<CatalogSubcategory | null>(null);
  const [editingLegacy, setEditingLegacy] = useState<LegacyCategory | null>(null);

  const [mainForm, setMainForm] = useState<MainCategoryForm>(emptyMainCategoryForm);
  const [subForm, setSubForm] = useState<SubcategoryForm>(emptySubcategoryForm);
  const [legacyForm, setLegacyForm] = useState<LegacyCategoryForm>(emptyLegacyCategoryForm);
  const [saving, setSaving] = useState(false);
  const [subMainFilter, setSubMainFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    const [mainRes, subRes, legacyRes] = await Promise.all([
      supabase.from('catalog_main_categories').select('*').order('display_order'),
      supabase.from('catalog_subcategories').select('*').order('display_order'),
      supabase.from('categories').select('*').order('display_order'),
    ]);

    setMainCategories((mainRes.data || []) as CatalogMainCategory[]);
    setSubcategories((subRes.data || []) as CatalogSubcategory[]);
    setLegacyCategories((legacyRes.data || []) as LegacyCategory[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const mainCategoryMap = useMemo(
    () => Object.fromEntries(mainCategories.map((item) => [item.id, item.name])),
    [mainCategories]
  );

  const filteredSubcategories = useMemo(() => {
    if (subMainFilter === 'all') return subcategories;
    return subcategories.filter((item) => item.main_category_id === subMainFilter);
  }, [subMainFilter, subcategories]);

  const openNewMain = () => {
    setEditingMain(null);
    setMainForm({ ...emptyMainCategoryForm, display_order: (mainCategories.length + 1) * 10 });
    setMainDialogOpen(true);
  };

  const openEditMain = (category: CatalogMainCategory) => {
    setEditingMain(category);
    setMainForm({
      name: category.name,
      slug: category.slug,
      image_url: category.image_url || '',
      description: category.description || '',
      display_order: category.display_order,
    });
    setMainDialogOpen(true);
  };

  const openNewSub = () => {
    setEditingSub(null);
    setSubForm({
      ...emptySubcategoryForm,
      main_category_id: mainCategories[0]?.id || '',
      legacy_category_name: legacyCategories[0]?.name || '',
      display_order: (subcategories.length + 1) * 10,
    });
    setSubDialogOpen(true);
  };

  const openEditSub = (subcategory: CatalogSubcategory) => {
    setEditingSub(subcategory);
    setSubForm({
      main_category_id: subcategory.main_category_id,
      name: subcategory.name,
      slug: subcategory.slug,
      image_url: subcategory.image_url || '',
      description: subcategory.description || '',
      legacy_category_name: subcategory.legacy_category_name || '',
      display_order: subcategory.display_order,
    });
    setSubDialogOpen(true);
  };

  const openNewLegacy = () => {
    setEditingLegacy(null);
    setLegacyForm({ ...emptyLegacyCategoryForm, display_order: (legacyCategories.length + 1) * 10 });
    setLegacyDialogOpen(true);
  };

  const openEditLegacy = (category: LegacyCategory) => {
    setEditingLegacy(category);
    setLegacyForm({
      name: category.name,
      icon: category.icon || '',
      display_order: category.display_order || 0,
    });
    setLegacyDialogOpen(true);
  };

  const saveMainCategory = async () => {
    if (!mainForm.name.trim()) {
      toast.error('Main category name is required');
      return;
    }

    const payload = {
      ...mainForm,
      slug: slugifyCatalogValue(mainForm.slug || mainForm.name),
    };

    setSaving(true);
    const response = editingMain
      ? await supabase.from('catalog_main_categories').update(payload).eq('id', editingMain.id)
      : await supabase.from('catalog_main_categories').insert(payload);

    setSaving(false);

    if (response.error) {
      toast.error(response.error.message || 'Failed to save main category');
      return;
    }

    toast.success(editingMain ? 'Main category updated' : 'Main category created');
    setMainDialogOpen(false);
    fetchData();
  };

  const saveSubcategory = async () => {
    if (!subForm.main_category_id || !subForm.name.trim()) {
      toast.error('Main category and subcategory name are required');
      return;
    }

    const payload = {
      ...subForm,
      slug: slugifyCatalogValue(subForm.slug || subForm.name),
    };

    setSaving(true);
    const response = editingSub
      ? await supabase.from('catalog_subcategories').update(payload).eq('id', editingSub.id)
      : await supabase.from('catalog_subcategories').insert(payload);

    setSaving(false);

    if (response.error) {
      toast.error(response.error.message || 'Failed to save subcategory');
      return;
    }

    toast.success(editingSub ? 'Subcategory updated' : 'Subcategory created');
    setSubDialogOpen(false);
    fetchData();
  };

  const saveLegacyCategory = async () => {
    if (!legacyForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);
    const response = editingLegacy
      ? await supabase.from('categories').update(legacyForm).eq('id', editingLegacy.id)
      : await supabase.from('categories').insert(legacyForm);

    setSaving(false);

    if (response.error) {
      toast.error(response.error.message || 'Failed to save category');
      return;
    }

    toast.success(editingLegacy ? 'Category updated' : 'Category created');
    setLegacyDialogOpen(false);
    fetchData();
  };

  const deleteMainCategory = async (id: string) => {
    const { error } = await supabase.from('catalog_main_categories').delete().eq('id', id);
    if (error) toast.error(error.message || 'Failed to delete main category');
    else {
      toast.success('Main category deleted');
      fetchData();
    }
  };

  const deleteSubcategory = async (id: string) => {
    const { error } = await supabase.from('catalog_subcategories').delete().eq('id', id);
    if (error) toast.error(error.message || 'Failed to delete subcategory');
    else {
      toast.success('Subcategory deleted');
      fetchData();
    }
  };

  const deleteLegacyCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) toast.error(error.message || 'Failed to delete category');
    else {
      toast.success('Category deleted');
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-slide-in">
        <h1 className="font-display text-2xl font-bold">Manage Catalog</h1>
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Manage Catalog</h1>
          <p className="text-sm text-muted-foreground">Admin can create and update main categories, subcategories, and product categories here.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="main">Main Categories</TabsTrigger>
          <TabsTrigger value="sub">Subcategories</TabsTrigger>
          <TabsTrigger value="legacy">Leaf Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="font-display text-lg">Main Categories</CardTitle>
              <Button onClick={openNewMain} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" /> Add Main Category
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="p-3">Order</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Slug</th>
                    <th className="p-3">Image</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mainCategories.map((category) => (
                    <tr key={category.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground">{category.display_order}</td>
                      <td className="p-3 font-medium">{category.name}</td>
                      <td className="p-3 text-muted-foreground">{category.slug}</td>
                      <td className="p-3 text-muted-foreground">{category.image_url ? 'Yes' : 'No'}</td>
                      <td className="space-x-1 p-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditMain(category)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {category.name}?</AlertDialogTitle>
                              <AlertDialogDescription>Subcategories under this main category will also be deleted. Products will remain but lose category links.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMainCategory(category.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sub">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div className="space-y-2">
                <CardTitle className="font-display text-lg">Subcategories</CardTitle>
                <Select value={subMainFilter} onValueChange={setSubMainFilter}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Filter by main category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Main Categories</SelectItem>
                    {mainCategories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openNewSub} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" /> Add Subcategory
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="p-3">Order</th>
                    <th className="p-3">Main Category</th>
                    <th className="p-3">Subcategory</th>
                    <th className="p-3">Slug</th>
                    <th className="p-3">Leaf Category</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubcategories.map((subcategory) => (
                    <tr key={subcategory.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground">{subcategory.display_order}</td>
                      <td className="p-3">{mainCategoryMap[subcategory.main_category_id] || '-'}</td>
                      <td className="p-3 font-medium">{subcategory.name}</td>
                      <td className="p-3 text-muted-foreground">{subcategory.slug}</td>
                      <td className="p-3 text-muted-foreground">{subcategory.legacy_category_name || '-'}</td>
                      <td className="space-x-1 p-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditSub(subcategory)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {subcategory.name}?</AlertDialogTitle>
                              <AlertDialogDescription>Products will remain but lose this subcategory link.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSubcategory(subcategory.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legacy">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="font-display text-lg">Leaf Categories</CardTitle>
              <Button onClick={openNewLegacy} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" /> Add Leaf Category
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                    <th className="p-3">Order</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Icon</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {legacyCategories.map((category) => (
                    <tr key={category.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground">{category.display_order}</td>
                      <td className="p-3 font-medium">{category.name}</td>
                      <td className="p-3 text-muted-foreground">{category.icon}</td>
                      <td className="space-x-1 p-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditLegacy(category)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {category.name}?</AlertDialogTitle>
                              <AlertDialogDescription>Products using this flat category should be reassigned first.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteLegacyCategory(category.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={mainDialogOpen} onOpenChange={setMainDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{editingMain ? 'Edit Main Category' : 'Add Main Category'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={mainForm.name} onChange={(e) => setMainForm((prev) => ({ ...prev, name: e.target.value, slug: prev.slug || slugifyCatalogValue(e.target.value) }))} /></div>
            <div><Label>Slug *</Label><Input value={mainForm.slug} onChange={(e) => setMainForm((prev) => ({ ...prev, slug: e.target.value }))} /></div>
            <div><Label>Image URL</Label><Input value={mainForm.image_url} onChange={(e) => setMainForm((prev) => ({ ...prev, image_url: e.target.value }))} /></div>
            <div><Label>Description</Label><Input value={mainForm.description} onChange={(e) => setMainForm((prev) => ({ ...prev, description: e.target.value }))} /></div>
            <div><Label>Display Order</Label><Input type="number" value={mainForm.display_order} onChange={(e) => setMainForm((prev) => ({ ...prev, display_order: Number(e.target.value) || 0 }))} /></div>
            <Button onClick={saveMainCategory} disabled={saving} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">{saving ? 'Saving...' : editingMain ? 'Update Main Category' : 'Create Main Category'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{editingSub ? 'Edit Subcategory' : 'Add Subcategory'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Main Category *</Label>
              <Select value={subForm.main_category_id} onValueChange={(value) => setSubForm((prev) => ({ ...prev, main_category_id: value }))}>
                <SelectTrigger><SelectValue placeholder="Select main category" /></SelectTrigger>
                <SelectContent>{mainCategories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Name *</Label><Input value={subForm.name} onChange={(e) => setSubForm((prev) => ({ ...prev, name: e.target.value, slug: prev.slug || slugifyCatalogValue(e.target.value) }))} /></div>
            <div><Label>Slug *</Label><Input value={subForm.slug} onChange={(e) => setSubForm((prev) => ({ ...prev, slug: e.target.value }))} /></div>
            <div><Label>Image URL</Label><Input value={subForm.image_url} onChange={(e) => setSubForm((prev) => ({ ...prev, image_url: e.target.value }))} /></div>
            <div><Label>Description</Label><Input value={subForm.description} onChange={(e) => setSubForm((prev) => ({ ...prev, description: e.target.value }))} /></div>
            <div>
              <Label>Leaf Category</Label>
              <Select value={subForm.legacy_category_name || '__none__'} onValueChange={(value) => setSubForm((prev) => ({ ...prev, legacy_category_name: value === '__none__' ? '' : value }))}>
                <SelectTrigger><SelectValue placeholder="Optional leaf category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {legacyCategories.map((category) => <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Display Order</Label><Input type="number" value={subForm.display_order} onChange={(e) => setSubForm((prev) => ({ ...prev, display_order: Number(e.target.value) || 0 }))} /></div>
            <Button onClick={saveSubcategory} disabled={saving} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">{saving ? 'Saving...' : editingSub ? 'Update Subcategory' : 'Create Subcategory'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={legacyDialogOpen} onOpenChange={setLegacyDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">{editingLegacy ? 'Edit Leaf Category' : 'Add Leaf Category'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={legacyForm.name} onChange={(e) => setLegacyForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
            <div><Label>Lucide Icon Name</Label><Input value={legacyForm.icon} onChange={(e) => setLegacyForm((prev) => ({ ...prev, icon: e.target.value }))} placeholder="e.g. Wrench, Zap, Package" /></div>
            <div><Label>Display Order</Label><Input type="number" value={legacyForm.display_order} onChange={(e) => setLegacyForm((prev) => ({ ...prev, display_order: Number(e.target.value) || 0 }))} /></div>
            <Button onClick={saveLegacyCategory} disabled={saving} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">{saving ? 'Saving...' : editingLegacy ? 'Update Category' : 'Create Category'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
