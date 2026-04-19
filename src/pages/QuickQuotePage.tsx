import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, FileText, Plus, Trash2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { resolveRoutingForItems, type RoutingResult } from '@/lib/hubNetwork';

type Product = {
  id: string;
  name: string;
  sku: string;
  company_name: string;
  category: string;
  unit: string;
};

type QuoteLine = {
  id: string;
  name: string;
  sku: string;
  quantity: string;
  unit: string;
  description: string;
  productId: string;
};

const createLine = (): QuoteLine => ({
  id: crypto.randomUUID(),
  name: '',
  sku: '',
  quantity: '1',
  unit: 'per piece',
  description: '',
  productId: '',
});

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

const getCellValue = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const foundKey = Object.keys(row).find((candidate) => normalizeHeader(candidate) === key);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      return String(row[foundKey]).trim();
    }
  }
  return '';
};

const QUICK_QUOTE_DRAFT_KEY = 'impir.quick_quote.draft';

export default function QuickQuotePage() {
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<QuoteLine[]>([createLine(), createLine(), createLine()]);
  const [routing, setRouting] = useState<RoutingResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successQuoteNumber, setSuccessQuoteNumber] = useState<string | null>(null);
  const [form, setForm] = useState({
    requesterName: profile?.full_name || '',
    requesterEmail: user?.email || profile?.email || '',
    requesterPhone: profile?.phone || '',
    company: profile?.company_name || '',
    projectType: 'Industrial',
    description: '',
    addressLine1: '',
    city: profile?.preferred_city || '',
    state: '',
    pincode: profile?.preferred_pincode || '',
    timeline: 'Flexible',
    contactMethod: 'Email',
    agreed: false,
  });

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name, sku, company_name, category, unit')
      .order('name')
      .then(({ data }) => setProducts((data || []) as Product[]));
  }, []);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      requesterName: profile?.full_name || current.requesterName,
      requesterEmail: user?.email || profile?.email || current.requesterEmail,
      requesterPhone: profile?.phone || current.requesterPhone,
      company: profile?.company_name || current.company,
      city: profile?.preferred_city || current.city,
      pincode: profile?.preferred_pincode || current.pincode,
    }));
  }, [profile?.company_name, profile?.email, profile?.full_name, profile?.phone, profile?.preferred_city, profile?.preferred_pincode, user?.email]);

  useEffect(() => {
    const savedDraft = window.sessionStorage.getItem(QUICK_QUOTE_DRAFT_KEY);
    if (!savedDraft) return;

    try {
      const parsed = JSON.parse(savedDraft) as { form?: typeof form; lines?: QuoteLine[] };
      if (parsed.form) {
        setForm((current) => ({ ...current, ...parsed.form }));
      }
      if (Array.isArray(parsed.lines) && parsed.lines.length > 0) {
        setLines(parsed.lines);
      }
    } catch {
      window.sessionStorage.removeItem(QUICK_QUOTE_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(QUICK_QUOTE_DRAFT_KEY, JSON.stringify({ form, lines }));
  }, [form, lines]);

  const resolveMatchedProduct = useCallback((line: QuoteLine) => {
    if (line.productId) {
      return products.find((product) => product.id === line.productId) || null;
    }

    const sku = line.sku.trim().toLowerCase();
    const name = line.name.trim().toLowerCase();

    if (sku) {
      const bySku = products.find((product) => product.sku.toLowerCase() === sku);
      if (bySku) return bySku;
    }

    if (name) {
      const exactName = products.find((product) => product.name.toLowerCase() === name);
      if (exactName) return exactName;

      const partialName = products.find((product) => product.name.toLowerCase().includes(name));
      if (partialName) return partialName;
    }

    return null;
  }, [products]);

  const preparedItems = useMemo(() => {
    return lines
      .map((line) => {
        const quantity = Number(line.quantity);
        const matchedProduct = resolveMatchedProduct(line);
        const name = line.name.trim();

        return {
          line,
          matchedProduct,
          quantity,
          name,
        };
      })
      .filter((item) => item.name && !Number.isNaN(item.quantity) && item.quantity > 0);
  }, [lines, resolveMatchedProduct]);

  const matchedCount = preparedItems.filter((item) => item.matchedProduct).length;

  const canAttemptSubmit =
    form.agreed &&
    preparedItems.length > 0 &&
    !!form.addressLine1.trim() &&
    !!form.city.trim() &&
    !!form.state.trim() &&
    form.pincode.trim().length === 6;

  useEffect(() => {
    if (!form.city.trim() || form.pincode.trim().length !== 6 || preparedItems.length === 0) {
      setRouting(null);
      return;
    }

    resolveRoutingForItems(
      { city: form.city, pincode: form.pincode },
      preparedItems.map((item) => ({
        product_id: item.matchedProduct?.id || '',
        quantity: item.quantity,
        name: item.name,
      })),
    )
      .then((result) => setRouting(result))
      .catch(() => setRouting(null));
  }, [form.city, form.pincode, preparedItems]);

  const updateForm = (field: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateLine = (lineId: string, updates: Partial<QuoteLine>) => {
    setLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...updates, productId: updates.productId ?? '' } : line)));
  };

  const addLine = () => {
    setLines((current) => [...current, createLine()]);
  };

  const removeLine = (lineId: string) => {
    setLines((current) => (current.length === 1 ? current : current.filter((line) => line.id !== lineId)));
  };

  const downloadSampleCsv = () => {
    const sample = [
      'product_name,sku,quantity,unit,description',
      'TMT Bar Fe 500,,120,kg,12mm preferred',
      'Cement OPC 53,OPC53-001,200,bag,ACC or UltraTech',
      'Safety Helmet,,50,per piece,Yellow color',
    ].join('\n');

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quick-quote-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        toast.error('The uploaded CSV is empty');
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      const parsedLines = rows
        .map((row) => {
          const name = getCellValue(row, ['product_name', 'product', 'name', 'item_name', 'item']);
          const sku = getCellValue(row, ['sku', 'product_sku', 'item_sku']);
          const quantity = getCellValue(row, ['quantity', 'qty']) || '1';
          const unit = getCellValue(row, ['unit', 'uom']) || 'per piece';
          const description = getCellValue(row, ['description', 'notes', 'specification', 'specifications']);

          if (!name && !sku && !description) {
            return null;
          }

          return {
            id: crypto.randomUUID(),
            name,
            sku,
            quantity,
            unit,
            description,
            productId: '',
          } satisfies QuoteLine;
        })
        .filter((line): line is QuoteLine => Boolean(line));

      if (parsedLines.length === 0) {
        toast.error('No valid item rows found in the CSV');
        return;
      }

      setLines(parsedLines);
      toast.success(`${parsedLines.length} rows loaded from CSV`);
    } catch {
      toast.error('Failed to read CSV file');
    } finally {
      event.target.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.agreed) {
      toast.error('Please accept the quote request terms');
      return;
    }

    if (preparedItems.length === 0) {
      toast.error('Add at least one valid item');
      return;
    }

    if (!form.addressLine1.trim() || !form.city.trim() || !form.state.trim() || form.pincode.trim().length !== 6) {
      toast.error('Enter complete delivery details before requesting a quote');
      return;
    }

    if (!routing?.isServiceable) {
      toast.error(routing?.summaryText || 'We are still checking serviceability for this location');
      return;
    }

    if (!user) {
      toast.error('Login or sign up to submit this quote request');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    setSubmitting(true);

    const productsData = preparedItems.map(({ line, matchedProduct, quantity, name }) => ({
      product_id: matchedProduct?.id || null,
      name,
      quantity,
      unit: line.unit.trim() || matchedProduct?.unit || 'per piece',
      sku: line.sku.trim() || matchedProduct?.sku || '',
      notes: line.description.trim(),
      source: matchedProduct ? 'catalog_match' : 'typed_entry',
    }));

    const { data, error } = await supabase
      .from('quotes')
      .insert({
        user_id: user.id,
        business_account_id: profile?.business_account_id || null,
        business_name: form.company.trim(),
        requested_by_name: form.requesterName.trim() || profile?.full_name || '',
        requested_by_email: form.requesterEmail.trim() || user.email || profile?.email || '',
        requested_by_phone: form.requesterPhone.trim() || profile?.phone || '',
        products: productsData,
        project_type: form.projectType,
        project_description: form.description,
        billing_address: {
          line1: form.addressLine1,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        delivery_address: {
          line1: form.addressLine1,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        routing_summary: {
          route_type: routing?.routeType,
          promise_text: routing?.promiseText,
          summary_text: routing?.summaryText,
          assigned_hub_id: routing?.assignedHub?.id || null,
          assigned_hub_city: routing?.assignedHub?.city_name || null,
          matched_hub_id: routing?.matchedHub?.id || null,
        },
        timeline: form.timeline,
        contact_method: form.contactMethod,
        payment_terms: 'To Be Confirmed',
        quote_number: 'temp',
      })
      .select('id, quote_number')
      .single();

    if (error || !data) {
      setSubmitting(false);
      toast.error(error?.message || 'Failed to submit quick quote');
      return;
    }

    await supabase.from('admin_notifications').insert({
      message: `New quick quote ${data.quote_number} submitted by ${profile?.full_name || 'a customer'} with ${productsData.length} items.`,
      type: 'quick_quote',
      reference_id: null,
    });
    const { error: notificationError } = await supabase.functions.invoke('quote-notifications', {
      body: {
        eventType: 'quote_submitted',
        quoteId: data.id,
      },
    });
    if (notificationError) {
      console.error('Quote notification failed', notificationError);
    }

    setSubmitting(false);
    window.sessionStorage.removeItem(QUICK_QUOTE_DRAFT_KEY);
    setSuccessQuoteNumber(data.quote_number);
  };

  const renderLineCard = (line: QuoteLine, index: number) => {
    const matchedProduct = resolveMatchedProduct(line);

    return (
      <div key={line.id} className="rounded-lg border p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Item {index + 1}</p>
            {matchedProduct ? (
              <Badge variant="secondary">{matchedProduct.sku}</Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Manual item</span>
            )}
          </div>
          <Button type="button" variant="outline" size="icon" onClick={() => removeLine(line.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`line-name-${line.id}`}>Product Name</Label>
            <Input
              id={`line-name-${line.id}`}
              value={line.name}
              onChange={(event) => updateLine(line.id, { name: event.target.value, productId: '' })}
              placeholder="TMT Bar Fe 500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`line-sku-${line.id}`}>SKU</Label>
            <Input
              id={`line-sku-${line.id}`}
              value={line.sku}
              onChange={(event) => updateLine(line.id, { sku: event.target.value, productId: '' })}
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`line-qty-${line.id}`}>Quantity</Label>
              <Input
                id={`line-qty-${line.id}`}
                type="number"
                min="1"
                step="1"
                value={line.quantity}
                onChange={(event) => updateLine(line.id, { quantity: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`line-unit-${line.id}`}>Unit</Label>
              <Input
                id={`line-unit-${line.id}`}
                value={line.unit}
                onChange={(event) => updateLine(line.id, { unit: event.target.value })}
                placeholder="per piece"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`line-description-${line.id}`}>Description</Label>
            <Textarea
              id={`line-description-${line.id}`}
              value={line.description}
              onChange={(event) => updateLine(line.id, { description: event.target.value })}
              placeholder="Brand, grade, size..."
              rows={3}
            />
          </div>
        </div>
      </div>
    );
  };

  if (successQuoteNumber) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-12 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-status-responded" />
          <h1 className="font-display text-2xl font-bold">Quick Quote Submitted</h1>
          <p className="mt-2 text-muted-foreground">
            Your quote <strong>{successQuoteNumber}</strong> has been submitted.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate(user ? '/dashboard' : '/')}>
              Back To Home
            </Button>
            {user && (
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => navigate('/quotes')}>
                View My Quotes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold">Quick Quote</h1>
        <p className="text-sm text-muted-foreground">
          {isMobile
            ? 'Add items one by one on mobile, or upload a CSV file with product_name, sku, quantity, unit, and description columns.'
            : 'Fill items in a CSV-style table or upload a CSV file with columns like product_name, sku, quantity, unit, description.'}
        </p>
        {!user && (
          <p className="text-sm text-muted-foreground">
            You can prepare the quote as a guest. We will ask you to login only when you submit it.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              CSV Quote Sheet
            </CardTitle>
            <CardDescription>Use the grid below like a spreadsheet, or upload a CSV and review the rows before submission.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button type="button" variant="outline" onClick={downloadSampleCsv} className={isMobile ? 'w-full justify-center' : ''}>
                <Download className="mr-2 h-4 w-4" />
                Download Sample CSV
              </Button>
              <Button type="button" variant="outline" onClick={() => uploadInputRef.current?.click()} className={isMobile ? 'w-full justify-center' : ''}>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleCsvUpload}
              />
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {preparedItems.length} valid rows
                </Badge>
                <Badge variant="outline">
                  {matchedCount} matched to catalog
                </Badge>
              </div>
            </div>

            {isMobile ? (
              <div className="space-y-3">
                {lines.map((line, index) => renderLineCard(line, index))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="p-3 text-left font-medium">Product Name</th>
                      <th className="p-3 text-left font-medium">SKU</th>
                      <th className="p-3 text-left font-medium">Quantity</th>
                      <th className="p-3 text-left font-medium">Unit</th>
                      <th className="p-3 text-left font-medium">Description</th>
                      <th className="p-3 text-left font-medium">Match</th>
                      <th className="p-3 text-left font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => {
                      const matchedProduct = resolveMatchedProduct(line);

                      return (
                        <tr key={line.id} className="border-t align-top">
                          <td className="p-2">
                            <Input
                              value={line.name}
                              onChange={(event) => updateLine(line.id, { name: event.target.value, productId: '' })}
                              placeholder="TMT Bar Fe 500"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={line.sku}
                              onChange={(event) => updateLine(line.id, { sku: event.target.value, productId: '' })}
                              placeholder="Optional"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={line.quantity}
                              onChange={(event) => updateLine(line.id, { quantity: event.target.value })}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={line.unit}
                              onChange={(event) => updateLine(line.id, { unit: event.target.value })}
                              placeholder="per piece"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={line.description}
                              onChange={(event) => updateLine(line.id, { description: event.target.value })}
                              placeholder="Brand, grade, size..."
                            />
                          </td>
                          <td className="p-2">
                            {matchedProduct ? (
                              <Badge variant="secondary">{matchedProduct.sku}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Manual item</span>
                            )}
                          </td>
                          <td className="p-2">
                            <Button type="button" variant="outline" size="icon" onClick={() => removeLine(line.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={addLine} className={isMobile ? 'w-full justify-center' : ''}>
                <Plus className="mr-2 h-4 w-4" />
                {isMobile ? 'Add Item' : 'Add Row'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Project And Delivery Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.requesterName} onChange={(event) => updateForm('requesterName', event.target.value)} disabled={!!user} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.requesterEmail} onChange={(event) => updateForm('requesterEmail', event.target.value)} disabled={!!user} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.requesterPhone} onChange={(event) => updateForm('requesterPhone', event.target.value)} disabled={!!user} />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={form.company} onChange={(event) => updateForm('company', event.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Project Type</Label>
                <Select value={form.projectType} onValueChange={(value) => updateForm('projectType', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Residential', 'Commercial', 'Industrial', 'Government', 'Other'].map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timeline</Label>
                <Select value={form.timeline} onValueChange={(value) => updateForm('timeline', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['ASAP', 'Within 1 Week', 'Within 1 Month', 'Flexible'].map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Project Description / Special Requirements</Label>
              <Textarea
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                placeholder="Any special requirements, preferred brands, grade, delivery notes..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label>Address Line 1</Label>
                <Input value={form.addressLine1} onChange={(event) => updateForm('addressLine1', event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(event) => updateForm('city', event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={form.state} onChange={(event) => updateForm('state', event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input value={form.pincode} onChange={(event) => updateForm('pincode', event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Preferred Contact</Label>
                <Select value={form.contactMethod} onValueChange={(value) => updateForm('contactMethod', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Email', 'Phone', 'WhatsApp'].map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
              <Checkbox checked={form.agreed} onCheckedChange={(checked) => updateForm('agreed', checked === true)} />
              <p className="text-sm text-muted-foreground">I agree to the terms and conditions for quote requests.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={submitting || !canAttemptSubmit} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display sm:flex-1">
                {submitting ? 'Submitting...' : user ? 'Request Quote' : 'Login To Submit Quote'}
              </Button>
              {user ? (
                <Button type="button" variant="outline" onClick={() => navigate('/quotes')} className={isMobile ? 'w-full' : ''}>
                  View Quotes
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => navigate('/products')} className={isMobile ? 'w-full' : ''}>
                  Browse Products
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
