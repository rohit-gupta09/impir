import { useEffect, useState } from 'react';
import { IndianRupee, Package, Truck, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const deliveryStatuses = ['Order Confirmed', 'Packed at Hub', 'Out for Delivery', 'Delivered'];

export default function HubDashboard() {
  const { user } = useAuth();
  const [hub, setHub] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  const load = async () => {
    if (!user) {
      return;
    }

    const { data: managedHub } = await (supabase as any)
      .from('hubs')
      .select('*')
      .eq('hub_manager_user_id', user.id)
      .single();

    setHub(managedHub || null);
    if (!managedHub) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [{ data: orderRows }, { data: inventoryRows }] = await Promise.all([
      (supabase as any)
        .from('orders')
        .select('*')
        .eq('assigned_hub_id', managedHub.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false }),
      (supabase as any)
        .from('hub_inventory')
        .select('hub_id, product_id, quantity_available, reorder_level, products(name, sku)')
        .eq('hub_id', managedHub.id)
        .order('last_updated', { ascending: false }),
    ]);

    setOrders(orderRows || []);
    setInventory(inventoryRows || []);
  };

  useEffect(() => {
    load();
  }, [user]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await (supabase as any).from('order_delivery_events').insert({
      order_id: orderId,
      status,
      updated_by: user?.id || null,
    });

    if (error) {
      toast.error('Failed to update delivery status');
      return;
    }

    toast.success('Delivery status updated');
    load();
  };

  const revenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const lowStock = inventory.filter((item) => item.quantity_available < item.reorder_level);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{hub ? `${hub.city_name} Hub` : 'Hub Dashboard'}</h1>
        <p className="text-sm text-muted-foreground">
          {hub ? `Manage today's routed orders, stock, low-stock alerts, and delivery progress for ${hub.city_name}.` : 'No hub is assigned to this login yet.'}
        </p>
      </div>

      {hub && (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Today's Orders</p><p className="font-display text-2xl font-bold mt-1">{orders.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Revenue</p><p className="font-display text-2xl font-bold mt-1">₹{Math.round(revenue).toLocaleString('en-IN')}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Inventory SKUs</p><p className="font-display text-2xl font-bold mt-1">{inventory.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Low Stock Alerts</p><p className="font-display text-2xl font-bold mt-1">{lowStock.length}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="font-display">Today's Assigned Orders</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders routed to this hub today.</p> : orders.map((order) => (
                <div key={order.id} className="rounded-md border p-4 space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{order.quote_number}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_city} - {order.customer_pincode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">₹{Math.round(order.total_amount || 0).toLocaleString('en-IN')}</span>
                      <Select value={order.status} onValueChange={(status) => updateOrderStatus(order.id, status)}>
                        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {deliveryStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {order.delivery_promise_text && <p className="text-sm text-muted-foreground">{order.delivery_promise_text}</p>}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="font-display">Hub Inventory</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {inventory.slice(0, 12).map((item) => (
                  <div key={`${item.hub_id}-${item.product_id}`} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div>
                      <p className="font-medium">{item.products?.name || 'Product'}</p>
                      <p className="text-muted-foreground">{item.products?.sku || item.product_id}</p>
                    </div>
                    <div className="text-right">
                      <p>{item.quantity_available} units</p>
                      <p className="text-muted-foreground">Reorder at {item.reorder_level}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-display">Low Stock Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {lowStock.length === 0 ? <p className="text-sm text-muted-foreground">No low-stock items right now.</p> : lowStock.map((item) => (
                  <div key={`${item.hub_id}-${item.product_id}`} className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                    <div>
                      <p className="font-medium">{item.products?.name || 'Product'}</p>
                      <p className="text-muted-foreground">{item.quantity_available} left</p>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
