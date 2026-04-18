import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ShoppingBag, User, Mail, Phone, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type OrderProduct = {
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  unit_price?: number;
  total_price?: number;
};

type Order = {
  id: string;
  user_id: string;
  quote_id: string;
  quote_number: string;
  products: OrderProduct[];
  total_amount: number;
  status: string;
  delivery_address: any;
  customer_city?: string;
  customer_pincode?: string;
  delivery_promise_text?: string;
  routing_type?: string;
  created_at: string;
};

type UserProfile = {
  full_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
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

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      const orderRows = (data as any) || [];
      setOrders(orderRows);

      const userIds = [...new Set(orderRows.map((order: Order) => order.user_id))] as string[];
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, phone, company_name')
          .in('user_id', userIds);

        const nextProfiles: Record<string, UserProfile> = {};
        (profileRows || []).forEach((profile: any) => {
          nextProfiles[profile.user_id] = profile;
        });
        setProfiles(nextProfiles);
      }

      setLoading(false);
    };

    fetchOrders();
  }, []);

  if (!loading && orders.length === 0) {
    return (
      <div className="text-center py-20 animate-slide-in">
        <ShoppingBag className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">No Orders Yet</h2>
        <p className="text-muted-foreground">Orders placed by customers will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-in">
      <h1 className="font-display text-2xl font-bold">Manage Orders</h1>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const profile = profiles[order.user_id];

            return (
              <Collapsible key={order.id} open={expanded === order.id} onOpenChange={() => setExpanded(expanded === order.id ? null : order.id)}>
                <Card className="border">
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-display font-bold">{order.quote_number}</p>
                          {profile?.full_name && (
                            <span className="text-xs text-muted-foreground">— {profile.full_name}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()} · {formatINR(order.total_amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[order.status] || 'bg-muted'}>{order.status}</Badge>
                        <ChevronDown className={`w-4 h-4 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} />
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4 border-t pt-3">
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
                          </div>
                        </div>
                      )}

                      {order.delivery_address?.city && (
                        <div className="rounded-md border p-3 text-sm">
                          <p className="font-medium">Delivery Location</p>
                          <p className="text-muted-foreground mt-1">
                            {order.delivery_address.address_line1 || order.delivery_address.line1 || ''} {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}
                          </p>
                          {order.delivery_promise_text && (
                            <p className="text-muted-foreground mt-1">Promise: {order.delivery_promise_text}</p>
                          )}
                        </div>
                      )}

                      <div className="border rounded overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-2">Product</th>
                              <th className="p-2">SKU</th>
                              <th className="p-2">Qty</th>
                              <th className="p-2">Unit</th>
                              <th className="p-2">Unit Price</th>
                              <th className="p-2">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(order.products) && order.products.map((product, index) => (
                              <tr key={index} className="border-t">
                                <td className="p-2">{product.name}</td>
                                <td className="p-2 text-center">{product.sku}</td>
                                <td className="p-2 text-center">{product.quantity}</td>
                                <td className="p-2 text-center">{product.unit}</td>
                                <td className="p-2 text-center">{product.unit_price ? formatINR(product.unit_price) : '—'}</td>
                                <td className="p-2 text-center font-medium">{product.total_price ? formatINR(product.total_price) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-muted/50">
                            <tr className="border-t font-bold">
                              <td colSpan={5} className="p-2 text-right">Total:</td>
                              <td className="p-2 text-center text-accent">{formatINR(order.total_amount)}</td>
                            </tr>
                          </tfoot>
                        </table>
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
