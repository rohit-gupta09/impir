import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ShoppingBag, IndianRupee } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

type OrderProduct = {
  name: string; sku: string; quantity: number; unit: string;
  unit_price?: number; total_price?: number;
};

type Order = {
  id: string; quote_number: string; products: OrderProduct[];
  total_amount: number; status: string; delivery_address: any;
  assigned_hub_id?: string | null;
  customer_city?: string;
  customer_pincode?: string;
  delivery_promise_text?: string;
  routing_type?: string;
  created_at: string;
};

const statusColors: Record<string, string> = {
  Confirmed: 'bg-status-responded text-accent-foreground',
  'Order Confirmed': 'bg-status-responded text-accent-foreground',
  'Packed at Hub': 'bg-status-review text-accent-foreground',
  'Out for Delivery': 'bg-accent text-accent-foreground',
  Delivered: 'bg-green-600 text-white',
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [eventsByOrder, setEventsByOrder] = useState<Record<string, Array<{ id: string; status: string; created_at: string }>>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders((data as any) || []);
      const orderIds = (data || []).map((order) => order.id);
      if (orderIds.length > 0) {
        const { data: events } = await (supabase as any)
          .from('order_delivery_events')
          .select('id, order_id, status, created_at')
          .in('order_id', orderIds)
          .order('created_at');
        setEventsByOrder(
          (events || []).reduce((acc: Record<string, Array<{ id: string; status: string; created_at: string }>>, event: any) => {
            acc[event.order_id] = [...(acc[event.order_id] || []), event];
            return acc;
          }, {}),
        );
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (!loading && orders.length === 0) {
    return (
      <div className="text-center py-20 animate-slide-in">
        <ShoppingBag className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">No Orders Yet</h2>
        <p className="text-muted-foreground mb-6">Accept a quote to place your first order</p>
        <Button onClick={() => navigate('/quotes')} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display tracking-wide">
          VIEW QUOTES
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-in">
      <h1 className="font-display text-2xl font-bold">My Orders</h1>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <Collapsible key={o.id} open={expanded === o.id} onOpenChange={() => setExpanded(expanded === o.id ? null : o.id)}>
              <Card className="border">
                <CollapsibleTrigger asChild>
                  <CardContent className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-display font-bold">{o.quote_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString()} · {formatINR(o.total_amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[o.status] || 'bg-muted'}>{o.status}</Badge>
                      <ChevronDown className={`w-4 h-4 transition-transform ${expanded === o.id ? 'rotate-180' : ''}`} />
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3 border-t pt-3">
                    {o.delivery_address?.city && (
                      <div className="rounded-md border p-3 text-sm">
                        <p className="font-medium">Delivery Location</p>
                        <p className="text-muted-foreground mt-1">
                          {o.delivery_address.city}, {o.delivery_address.state} - {o.delivery_address.pincode}
                        </p>
                      </div>
                    )}
                    <div className="border rounded overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2">Product</th>
                            <th className="p-2">Qty</th>
                            <th className="p-2">Unit Price</th>
                            <th className="p-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(o.products) && o.products.map((p, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{p.name}</td>
                              <td className="p-2 text-center">{p.quantity}</td>
                              <td className="p-2 text-center">{p.unit_price ? formatINR(p.unit_price) : '—'}</td>
                              <td className="p-2 text-center font-medium">{p.total_price ? formatINR(p.total_price) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/50">
                          <tr className="border-t font-bold">
                            <td colSpan={3} className="p-2 text-right">Total:</td>
                            <td className="p-2 text-center text-accent">{formatINR(o.total_amount)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Delivery Tracking</p>
                      <div className="grid gap-2 md:grid-cols-4">
                        {['Order Confirmed', 'Packed at Hub', 'Out for Delivery', 'Delivered'].map((status) => {
                          const event = (eventsByOrder[o.id] || []).find((entry) => entry.status === status);
                          return (
                            <div key={status} className={`rounded-md border p-3 text-xs ${event ? 'border-accent/20 bg-accent/5' : 'bg-muted/40'}`}>
                              <p className="font-medium">{status}</p>
                              <p className="text-muted-foreground mt-1">
                                {event ? new Date(event.created_at).toLocaleString() : 'Pending'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
