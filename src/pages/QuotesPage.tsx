import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, ChevronDown, ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type QuoteProduct = {
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  product_id?: string;
  unit_price?: number;
  total_price?: number;
};

type Quote = {
  id: string;
  quote_number: string;
  products: QuoteProduct[];
  project_type: string;
  project_description: string;
  delivery_address: any;
  timeline: string;
  contact_method: string;
  status: string;
  admin_response: string;
  business_account_id?: string | null;
  payment_terms?: string | null;
  business_name?: string | null;
  routing_summary?: any;
  created_at: string;
  updated_at: string;
};

const statusColors: Record<string, string> = {
  Pending: 'bg-status-pending text-foreground',
  'Under Review': 'bg-status-review text-accent-foreground',
  Responded: 'bg-status-responded text-accent-foreground',
  Closed: 'bg-status-closed text-accent-foreground',
  Accepted: 'bg-green-600 text-white',
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

export default function QuotesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [placingOrderId, setPlacingOrderId] = useState<string | null>(null);

  const fetchQuotes = async () => {
    if (!user) return;
    let query = supabase.from('quotes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (statusFilter !== 'All') query = query.eq('status', statusFilter);
    const { data } = await query;
    setQuotes((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotes();
  }, [user, statusFilter]);

  const getQuoteTotal = (products: QuoteProduct[]): number =>
    products.reduce((sum, product) => sum + (product.total_price || (product.unit_price || 0) * (product.quantity || 1)), 0);

  const hasPricing = (products: QuoteProduct[]): boolean =>
    products.some((product) => product.unit_price && product.unit_price > 0);

  const handlePlaceOrder = async (quote: Quote) => {
    if (!user) return;

    setPlacingOrderId(quote.id);
    const totalAmount = getQuoteTotal(quote.products);

    const { error: quoteError } = await supabase
      .from('quotes')
      .update({ status: 'Accepted' })
      .eq('id', quote.id);

    if (quoteError) {
      toast.error(quoteError.message || 'Failed to confirm quote');
      setPlacingOrderId(null);
      return;
    }

    const { error: orderError } = await supabase.from('orders').insert({
      user_id: user.id,
      quote_id: quote.id,
      quote_number: quote.quote_number,
      products: quote.products,
      total_amount: totalAmount,
      subtotal_amount: totalAmount,
      discount_amount: 0,
      payable_amount: totalAmount,
      payment_status: 'pending',
      payment_gateway: 'no_payment',
      payment_reference: '',
      offer_code: '',
      offer_title: '',
      delivery_address: quote.delivery_address,
      assigned_hub_id: quote.routing_summary?.assigned_hub_id || null,
      customer_city: quote.delivery_address?.city || '',
      customer_pincode: quote.delivery_address?.pincode || '',
      delivery_promise_text: quote.routing_summary?.promise_text || '',
      promised_service_level: quote.routing_summary?.route_type || '',
      routing_type: quote.routing_summary?.route_type || 'central_fallback',
      status: 'Order Confirmed',
    });

    if (orderError) {
      toast.error(orderError.message || 'Failed to create order');
      setPlacingOrderId(null);
      return;
    }

    await supabase.from('admin_notifications').insert({
      message: `Quote ${quote.quote_number} was converted to an order without online payment.`,
      type: 'order',
      reference_id: quote.id,
    });

    toast.success(`Order placed for ${quote.quote_number}`);
    setPlacingOrderId(null);
    fetchQuotes();
    navigate('/orders');
  };

  if (!loading && quotes.length === 0) {
    return (
      <div className="text-center py-20 animate-slide-in">
        <FileText className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">No Quotes Yet</h2>
        <p className="text-muted-foreground mb-6">Add products to your cart and request a quote</p>
        <Button onClick={() => navigate('/products')} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display tracking-wide">
          BROWSE PRODUCTS
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">My Quotes</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['All', 'Pending', 'Under Review', 'Responded', 'Accepted', 'Closed'].map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => {
            const total = getQuoteTotal(quote.products);
            const priced = hasPricing(quote.products);

            return (
              <Collapsible key={quote.id} open={expanded === quote.id} onOpenChange={() => setExpanded(expanded === quote.id ? null : quote.id)}>
                <Card className="border">
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-display font-bold">{quote.quote_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(quote.created_at).toLocaleDateString()} · {quote.products.length} items
                            {priced && <span className="ml-1 font-medium text-accent"> · {formatINR(total)}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[quote.status] || 'bg-muted'}>{quote.status}</Badge>
                        <ChevronDown className={`w-4 h-4 transition-transform ${expanded === quote.id ? 'rotate-180' : ''}`} />
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-3 border-t pt-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Project Type:</span> {quote.project_type}</div>
                        <div><span className="text-muted-foreground">Timeline:</span> {quote.timeline}</div>
                        <div><span className="text-muted-foreground">Contact:</span> {quote.contact_method}</div>
                        {quote.payment_terms && (
                          <div><span className="text-muted-foreground">Payment Terms:</span> {quote.payment_terms}</div>
                        )}
                        {quote.delivery_address?.city && (
                          <div><span className="text-muted-foreground">Delivery:</span> {quote.delivery_address.city}, {quote.delivery_address.state}</div>
                        )}
                      </div>

                      {quote.project_description && (
                        <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {quote.project_description}</p>
                      )}

                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Products:</p>
                        <div className="border rounded overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-muted">
                              <tr>
                                <th className="text-left p-2">Product</th>
                                <th className="p-2">SKU</th>
                                <th className="p-2">Qty</th>
                                <th className="p-2">Unit</th>
                                {priced && <th className="p-2">Unit Price</th>}
                                {priced && <th className="p-2">Total</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {quote.products.map((product, index) => (
                                <tr key={index} className="border-t">
                                  <td className="p-2">{product.name}</td>
                                  <td className="p-2 text-center">{product.sku}</td>
                                  <td className="p-2 text-center">{product.quantity}</td>
                                  <td className="p-2 text-center">{product.unit}</td>
                                  {priced && <td className="p-2 text-center">{product.unit_price ? formatINR(product.unit_price) : '—'}</td>}
                                  {priced && <td className="p-2 text-center font-medium">{product.unit_price ? formatINR(product.unit_price * product.quantity) : '—'}</td>}
                                </tr>
                              ))}
                            </tbody>
                            {priced && (
                              <tfoot className="bg-muted/50">
                                <tr className="border-t font-bold">
                                  <td colSpan={5} className="p-2 text-right">Grand Total:</td>
                                  <td className="p-2 text-center text-accent">{formatINR(total)}</td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </div>

                      {quote.admin_response && (
                        <div className="bg-status-responded/10 border border-status-responded/30 rounded p-3">
                          <p className="text-xs font-medium text-status-responded mb-1">Admin Response:</p>
                          <p className="text-sm">{quote.admin_response}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {quote.status === 'Responded' && priced && (
                          <Button
                            onClick={() => handlePlaceOrder(quote)}
                            disabled={placingOrderId === quote.id}
                            className="bg-green-600 hover:bg-green-700 text-white font-display"
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            {placingOrderId === quote.id ? 'Placing Order...' : 'Place Order'}
                          </Button>
                        )}
                        {quote.status === 'Accepted' && (
                          <Button variant="outline" onClick={() => navigate('/orders')}>
                            View Order
                          </Button>
                        )}
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
