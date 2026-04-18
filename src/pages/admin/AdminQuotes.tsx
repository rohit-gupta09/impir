import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Send, IndianRupee, User, Mail, Phone, Building2, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type QuoteProduct = {
  name: string; sku: string; quantity: number; unit: string;
  product_id?: string; unit_price?: number;
};

type UserProfile = {
  business_account_id?: string | null;
  designation?: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  avatar_url: string | null;
};

type Quote = {
  id: string; quote_number: string; products: QuoteProduct[]; project_type: string;
  project_description: string; delivery_address: any; timeline: string;
  contact_method: string; status: string; admin_response: string;
  business_account_id?: string | null;
  business_name?: string | null;
  requested_by_name?: string | null;
  requested_by_email?: string | null;
  requested_by_phone?: string | null;
  payment_terms?: string | null;
  created_at: string; updated_at: string; user_id: string;
};

type QuoteVersion = {
  id: string;
  quote_id: string;
  version_number: number;
  status: string;
  reason: string;
  source: string;
  payment_terms: string;
  total_amount: number;
  created_at: string;
};

const statuses = ['All', 'Pending', 'Under Review', 'Responded', 'Accepted', 'Closed'];
const statusColors: Record<string, string> = {
  Pending: 'bg-status-pending text-foreground',
  'Under Review': 'bg-status-review text-accent-foreground',
  Responded: 'bg-status-responded text-accent-foreground',
  Accepted: 'bg-green-600 text-white',
  Closed: 'bg-status-closed text-accent-foreground',
};

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});
  const [paymentTermsUpdates, setPaymentTermsUpdates] = useState<Record<string, string>>({});
  const [priceUpdates, setPriceUpdates] = useState<Record<string, Record<number, string>>>({});
  const [quoteVersions, setQuoteVersions] = useState<Record<string, QuoteVersion[]>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchQuotes = async () => {
    let query = supabase.from('quotes').select('*').order('created_at', { ascending: false });
    if (filter !== 'All') query = query.eq('status', filter);
    const { data } = await query;
    const quotesData = (data as any) || [];
    setQuotes(quotesData);
    const quoteIds = quotesData.map((q: Quote) => q.id) as string[];

    if (quoteIds.length > 0) {
      const [{ data: versions }] = await Promise.all([
        supabase
          .from('quote_versions')
          .select('id, quote_id, version_number, status, reason, source, payment_terms, total_amount, created_at')
          .in('quote_id', quoteIds)
          .order('version_number', { ascending: false }),
      ]);

      const versionsMap: Record<string, QuoteVersion[]> = {};
      (versions || []).forEach((version) => {
        const row = version as unknown as QuoteVersion;
        versionsMap[row.quote_id] = [...(versionsMap[row.quote_id] || []), row];
      });
      setQuoteVersions(versionsMap);
    } else {
      setQuoteVersions({});
    }

    // Fetch user profiles for all unique user_ids
    const userIds = [...new Set(quotesData.map((q: Quote) => q.user_id))] as string[];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, business_account_id, designation, full_name, email, phone, company_name, avatar_url')
        .in('user_id', userIds);

      const profileMap: Record<string, UserProfile> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
      setUserProfiles(profileMap);
    }

    setLoading(false);
  };

  useEffect(() => { fetchQuotes(); }, [filter]);

  const getPrice = (quoteId: string, index: number, product: QuoteProduct): string => {
    return priceUpdates[quoteId]?.[index] ?? (product.unit_price?.toString() || '');
  };

  const setPrice = (quoteId: string, index: number, value: string) => {
    setPriceUpdates(prev => ({
      ...prev,
      [quoteId]: { ...prev[quoteId], [index]: value }
    }));
  };

  const getQuoteTotal = (quote: Quote): number => {
    return (quote.products || []).reduce((sum, p, i) => {
      const price = parseFloat(getPrice(quote.id, i, p)) || 0;
      return sum + price * (p.quantity || 1);
    }, 0);
  };

  const handleSave = async (quote: Quote) => {
    setSaving(quote.id);
    const updates: any = {};
    if (statusUpdates[quote.id]) updates.status = statusUpdates[quote.id];
    if (responses[quote.id] !== undefined) updates.admin_response = responses[quote.id];
    if (paymentTermsUpdates[quote.id] !== undefined) updates.payment_terms = paymentTermsUpdates[quote.id];

    if (priceUpdates[quote.id]) {
      const updatedProducts = quote.products.map((p, i) => {
        const priceStr = priceUpdates[quote.id]?.[i];
        const unitPrice = priceStr !== undefined ? parseFloat(priceStr) || 0 : (p.unit_price || 0);
        return { ...p, unit_price: unitPrice, total_price: unitPrice * (p.quantity || 1) };
      });
      updates.products = updatedProducts;
    }

    if (Object.keys(updates).length === 0) { setSaving(null); return; }

    const { error } = await supabase.from('quotes').update(updates).eq('id', quote.id);
    if (error) { toast.error(error.message || 'Failed to update quote'); }
    else {
      await supabase.rpc('create_quote_version_from_quote', {
        _quote_id: quote.id,
        _created_by: null,
        _source: 'admin',
        _reason: 'admin_pricing_update',
      });
      toast.success(`Quote ${quote.quote_number} updated`);
      if (updates.status) {
        await supabase.from('notifications').insert({
          user_id: quote.user_id,
          message: `Your quote ${quote.quote_number} status changed to "${updates.status}"${updates.status === 'Responded' ? '. Check your quote for pricing details.' : '.'}`,
        });
      }
      setPriceUpdates(prev => { const n = { ...prev }; delete n[quote.id]; return n; });
      fetchQuotes();
    }
    setSaving(null);
  };

  const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Manage Quotes</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : quotes.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">No quotes found.</p>
      ) : (
        <div className="space-y-3">
          {quotes.map(q => {
            const profile = userProfiles[q.user_id];
            return (
              <Collapsible key={q.id} open={expanded === q.id} onOpenChange={() => setExpanded(expanded === q.id ? null : q.id)}>
                <Card className="border">
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-display font-bold">{q.quote_number}</p>
                          {profile && (
                            <span className="text-xs text-muted-foreground">— {profile.full_name}</span>
                          )}
                        </div>
                          <p className="text-xs text-muted-foreground">
                          {new Date(q.created_at).toLocaleDateString()} · {Array.isArray(q.products) ? q.products.length : 0} items · {q.project_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[q.status] || 'bg-muted'}>{q.status}</Badge>
                        <ChevronDown className={`w-4 h-4 transition-transform ${expanded === q.id ? 'rotate-180' : ''}`} />
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4 border-t pt-3">
                      {/* Customer details */}
                      {profile && (
                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                          <p className="text-xs font-display font-bold text-primary mb-2">Customer Details</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{profile.full_name}</span>
                            </div>
                            {profile.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="break-all">{profile.email}</span>
                              </div>
                            )}
                            {profile.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{profile.phone}</span>
                              </div>
                            )}
                            {profile.company_name && (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{profile.company_name}</span>
                              </div>
                            )}
                            {!profile.company_name && q.business_name && (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{q.business_name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {q.user_id}
                              </Badge>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Preferred contact: {q.contact_method}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Project:</span> {q.project_type}</div>
                        <div><span className="text-muted-foreground">Timeline:</span> {q.timeline}</div>
                        <div><span className="text-muted-foreground">Contact:</span> {q.contact_method}</div>
                        {q.payment_terms && (
                          <div><span className="text-muted-foreground">Payment Terms:</span> {q.payment_terms}</div>
                        )}
                        {q.delivery_address?.city && (
                          <div className="col-span-2"><span className="text-muted-foreground">Delivery:</span> {q.delivery_address.address_line1 || q.delivery_address.line1}, {q.delivery_address.city}, {q.delivery_address.state} {q.delivery_address.pincode}</div>
                        )}
                      </div>
                      {q.project_description && (
                        <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {q.project_description}</p>
                      )}

                      {quoteVersions[q.id]?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-display font-bold text-primary flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Quote Version History
                          </p>
                          <div className="space-y-2">
                            {quoteVersions[q.id].map((version) => (
                              <div key={version.id} className="rounded border p-3 text-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="font-medium">Version {version.version_number}</div>
                                  <div className="text-xs text-muted-foreground">{new Date(version.created_at).toLocaleString()}</div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {version.source} · {version.reason} · {version.status} · {version.payment_terms}
                                  {version.total_amount > 0 ? ` · ${formatINR(version.total_amount)}` : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Products table with pricing */}
                      <div className="border rounded overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-2">Product</th>
                              <th className="p-2">SKU</th>
                              <th className="p-2">Qty</th>
                              <th className="p-2">Unit</th>
                              <th className="p-2 min-w-[120px]">Unit Price (₹)</th>
                              <th className="p-2">Line Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(q.products) && q.products.map((p, i) => {
                              const unitPrice = parseFloat(getPrice(q.id, i, p)) || 0;
                              const lineTotal = unitPrice * (p.quantity || 1);
                              return (
                                <tr key={i} className="border-t">
                                  <td className="p-2">{p.name}</td>
                                  <td className="p-2 text-center">{p.sku}</td>
                                  <td className="p-2 text-center">{p.quantity}</td>
                                  <td className="p-2 text-center">{p.unit}</td>
                                  <td className="p-2">
                                    <div className="relative">
                                      <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                        value={getPrice(q.id, i, p)}
                                        onChange={(e) => setPrice(q.id, i, e.target.value)}
                                        className="h-7 pl-6 text-xs w-full"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-2 text-center font-medium">
                                    {unitPrice > 0 ? formatINR(lineTotal) : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-muted/50">
                            <tr className="border-t font-bold">
                              <td colSpan={5} className="p-2 text-right">Grand Total:</td>
                              <td className="p-2 text-center text-accent">{formatINR(getQuoteTotal(q))}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Admin actions */}
                      <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                        <h4 className="font-display font-bold text-sm">Admin Response</h4>
                        <div className="flex gap-3 items-center">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Select value={statusUpdates[q.id] || q.status} onValueChange={(v) => setStatusUpdates(p => ({ ...p, [q.id]: v }))}>
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {statuses.filter(s => s !== 'All').map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          placeholder="Payment terms"
                          value={paymentTermsUpdates[q.id] ?? q.payment_terms ?? ''}
                          onChange={(e) => setPaymentTermsUpdates((p) => ({ ...p, [q.id]: e.target.value }))}
                        />
                        <Textarea
                          placeholder="Type your response to the customer..."
                          value={responses[q.id] ?? q.admin_response ?? ''}
                          onChange={(e) => setResponses(p => ({ ...p, [q.id]: e.target.value }))}
                          rows={3}
                        />
                        <Button
                          onClick={() => handleSave(q)}
                          disabled={saving === q.id}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground font-display"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {saving === q.id ? 'Saving...' : 'Save Pricing & Notify Customer'}
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
