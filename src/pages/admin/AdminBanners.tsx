import { useEffect, useState, type ChangeEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Building2, ImagePlus, Pencil, TicketPercent, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type CompanyBanner = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_image_url: string | null;
  is_active: boolean;
};

type PromoBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_label: string | null;
  link_type: string;
  link_value: string | null;
  position: string;
  display_order: number;
  is_active: boolean;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const emptyCompanyForm = { name: '', slug: '', logo_url: '', banner_image_url: '', is_active: true };
const emptyPromoForm = { title: '', subtitle: '', image_url: '', cta_label: '', link_type: 'products', link_value: '', position: 'home', display_order: '0', is_active: true };

export default function AdminBanners() {
  const [companies, setCompanies] = useState<CompanyBanner[]>([]);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [promoForm, setPromoForm] = useState(emptyPromoForm);
  const [promoFileName, setPromoFileName] = useState('');
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [companyRes, promoRes] = await Promise.all([
      supabase.from('companies').select('*').order('name'),
      supabase.from('promo_banners').select('*').order('display_order').order('created_at'),
    ]);

    setCompanies(companyRes.data || []);
    setPromoBanners(promoRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCompany = async () => {
    if (!companyForm.name.trim()) {
      toast.error('Company name is required');
      return;
    }

    const slug = slugify(companyForm.slug || companyForm.name);
    if (!slug) {
      toast.error('Valid slug is required');
      return;
    }

    setSavingCompany(true);
    const payload = {
      name: companyForm.name.trim(),
      slug,
      logo_url: companyForm.logo_url.trim() || null,
      banner_image_url: companyForm.banner_image_url.trim() || null,
      is_active: companyForm.is_active,
    };
    const { error } = editingCompanyId
      ? await supabase.from('companies').update(payload).eq('id', editingCompanyId)
      : await supabase.from('companies').insert(payload);

    if (error) toast.error(error.message || 'Failed to save company banner');
    else {
      toast.success(editingCompanyId ? 'Company banner updated' : 'Company banner saved');
      setCompanyForm(emptyCompanyForm);
      setEditingCompanyId(null);
      fetchData();
    }
    setSavingCompany(false);
  };

  const handleSavePromoBanner = async () => {
    if (!promoForm.image_url.trim()) {
      toast.error('Banner image is required');
      return;
    }

    setSavingPromo(true);
    const payload = {
      title: promoForm.title.trim(),
      subtitle: promoForm.subtitle.trim() || null,
      image_url: promoForm.image_url.trim(),
      cta_label: promoForm.cta_label.trim() || null,
      link_type: promoForm.link_type,
      link_value: promoForm.link_value.trim() || null,
      position: promoForm.position,
      display_order: Number(promoForm.display_order) || 0,
      is_active: promoForm.is_active,
    };
    const { error } = editingPromoId
      ? await supabase.from('promo_banners').update(payload).eq('id', editingPromoId)
      : await supabase.from('promo_banners').insert(payload);

    if (error) toast.error(error.message || 'Failed to save promo banner');
    else {
      toast.success(editingPromoId ? 'Offer banner updated' : 'Offer banner saved');
      setPromoForm(emptyPromoForm);
      setPromoFileName('');
      setEditingPromoId(null);
      fetchData();
    }
    setSavingPromo(false);
  };

  const handlePromoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        toast.error('Failed to read the selected image');
        return;
      }

      setPromoForm((prev) => ({ ...prev, image_url: result }));
      setPromoFileName(file.name);
      toast.success('Banner image loaded');
    };
    reader.onerror = () => toast.error('Failed to read the selected image');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleDeleteCompany = async (id: string) => {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) toast.error(error.message || 'Failed to delete company banner');
    else {
      toast.success('Company banner deleted');
      fetchData();
    }
  };

  const handleDeletePromoBanner = async (id: string) => {
    const { error } = await supabase.from('promo_banners').delete().eq('id', id);
    if (error) toast.error(error.message || 'Failed to delete offer banner');
    else {
      toast.success('Offer banner deleted');
      fetchData();
    }
  };

  const startEditingCompany = (company: CompanyBanner) => {
    setEditingCompanyId(company.id);
    setCompanyForm({
      name: company.name,
      slug: company.slug,
      logo_url: company.logo_url || '',
      banner_image_url: company.banner_image_url || '',
      is_active: company.is_active,
    });
  };

  const cancelEditingCompany = () => {
    setEditingCompanyId(null);
    setCompanyForm(emptyCompanyForm);
  };

  const startEditingPromo = (banner: PromoBanner) => {
    setEditingPromoId(banner.id);
    setPromoForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      cta_label: banner.cta_label || '',
      link_type: banner.link_type,
      link_value: banner.link_value || '',
      position: banner.position,
      display_order: String(banner.display_order),
      is_active: banner.is_active,
    });
    setPromoFileName('');
  };

  const cancelEditingPromo = () => {
    setEditingPromoId(null);
    setPromoForm(emptyPromoForm);
    setPromoFileName('');
  };

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Company And Offer Banners</h1>
          <p className="text-sm text-muted-foreground">Add banner images for companies and promotional offers shown on the home page.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{companies.length} companies</Badge>
          <Badge variant="outline">{promoBanners.length} offer banners</Badge>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-accent" />
                  {editingCompanyId ? 'Edit Company Banner' : 'Company Banners'}
                </CardTitle>
                <CardDescription>
                  Use the same company name you use on products so clicking the banner opens the correct company products.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input value={companyForm.name} onChange={(e) => setCompanyForm((prev) => ({ ...prev, name: e.target.value, slug: prev.slug || slugify(e.target.value) }))} placeholder="Asian Paints" />
                </div>
                <div>
                  <Label>Slug *</Label>
                  <Input value={companyForm.slug} onChange={(e) => setCompanyForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))} placeholder="asian-paints" />
                </div>
                <div>
                  <Label>Banner Image URL</Label>
                  <Input value={companyForm.banner_image_url} onChange={(e) => setCompanyForm((prev) => ({ ...prev, banner_image_url: e.target.value }))} placeholder="https://..." />
                </div>
                <div>
                  <Label>Logo URL</Label>
                  <Input value={companyForm.logo_url} onChange={(e) => setCompanyForm((prev) => ({ ...prev, logo_url: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={companyForm.is_active} onCheckedChange={(value) => setCompanyForm((prev) => ({ ...prev, is_active: value }))} />
                  <Label>Show this company on home page</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveCompany} disabled={savingCompany} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-display">
                    <ImagePlus className="w-4 h-4 mr-2" />
                    {savingCompany ? 'Saving...' : editingCompanyId ? 'Update Company Banner' : 'Save Company Banner'}
                  </Button>
                  {editingCompanyId ? (
                    <Button type="button" variant="outline" onClick={cancelEditingCompany}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <TicketPercent className="w-5 h-5 text-accent" />
                  {editingPromoId ? 'Edit Offer Banner' : 'Offer Banners'}
                </CardTitle>
                <CardDescription>
                  Add home-page promotion banners for discounts, launches, or campaign offers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Banner Title</Label>
                  <Input value={promoForm.title} onChange={(e) => setPromoForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Flat 20% Off On Power Tools" />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Textarea value={promoForm.subtitle} onChange={(e) => setPromoForm((prev) => ({ ...prev, subtitle: e.target.value }))} rows={2} placeholder="Limited period offer for bulk buyers." />
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Banner Image *</Label>
                    <Input type="file" accept="image/*" onChange={handlePromoFileChange} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {promoFileName ? `Selected file: ${promoFileName}` : 'Upload a banner image from your local machine.'}
                  </p>
                  {promoForm.image_url && (
                    <div className="overflow-hidden rounded-md border bg-muted">
                      <img src={promoForm.image_url} alt="Offer banner preview" className="h-36 w-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>CTA Label</Label>
                    <Input value={promoForm.cta_label} onChange={(e) => setPromoForm((prev) => ({ ...prev, cta_label: e.target.value }))} placeholder="Shop Now" />
                  </div>
                  <div>
                    <Label>Display Order</Label>
                    <Input type="number" value={promoForm.display_order} onChange={(e) => setPromoForm((prev) => ({ ...prev, display_order: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Link Type</Label>
                    <Select value={promoForm.link_type} onValueChange={(value) => setPromoForm((prev) => ({ ...prev, link_type: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="products">All Products</SelectItem>
                        <SelectItem value="company">Company Products</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="quick_quote">Quick Quote</SelectItem>
                        <SelectItem value="quotes">Quotes</SelectItem>
                        <SelectItem value="external">External URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Link Value</Label>
                    <Input value={promoForm.link_value} onChange={(e) => setPromoForm((prev) => ({ ...prev, link_value: e.target.value }))} placeholder="Company name, category name, or URL. Leave blank for Quick Quote." />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={promoForm.is_active} onCheckedChange={(value) => setPromoForm((prev) => ({ ...prev, is_active: value }))} />
                  <Label>Show this offer on home page</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSavePromoBanner} disabled={savingPromo} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-display">
                    <ImagePlus className="w-4 h-4 mr-2" />
                    {savingPromo ? 'Saving...' : editingPromoId ? 'Update Offer Banner' : 'Save Offer Banner'}
                  </Button>
                  {editingPromoId ? (
                    <Button type="button" variant="outline" onClick={cancelEditingPromo}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Saved Company Banners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {companies.length > 0 ? companies.map((company) => (
                <div key={company.id} className="rounded-md border p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-14 rounded overflow-hidden bg-muted">
                      {company.banner_image_url ? <img src={company.banner_image_url} alt={company.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No banner</div>}
                    </div>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={company.is_active ? 'secondary' : 'outline'}>{company.is_active ? 'Active' : 'Inactive'}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => startEditingCompany(company)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {company.name}?</AlertDialogTitle>
                          <AlertDialogDescription>This removes the company banner record from the home page.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCompany(company.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )) : <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No company banners added yet.</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Saved Offer Banners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {promoBanners.length > 0 ? promoBanners.map((banner) => (
                <div key={banner.id} className="rounded-md border p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-14 rounded overflow-hidden bg-muted">
                      <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium">{banner.title}</p>
                      <p className="text-xs text-muted-foreground">{banner.link_type}{banner.link_value ? ` • ${banner.link_value}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={banner.is_active ? 'secondary' : 'outline'}>{banner.is_active ? 'Active' : 'Inactive'}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => startEditingPromo(banner)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {banner.title}?</AlertDialogTitle>
                          <AlertDialogDescription>This removes the promotional banner from the home page.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePromoBanner(banner.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )) : <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No offer banners added yet.</div>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
