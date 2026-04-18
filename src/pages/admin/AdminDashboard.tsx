import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, FileText, Package, Warehouse, MapPinned, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const currency = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [notifyRequests, setNotifyRequests] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id, name, sku'),
      (supabase as any).from('orders').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('serviceability_notify_requests').select('*'),
      (supabase as any).from('hubs').select('*'),
    ]).then(([productRes, orderRes, notifyRes, hubRes]) => {
      setProducts(productRes.data || []);
      setOrders(orderRes.data || []);
      setNotifyRequests(notifyRes.data || []);
      setHubs(hubRes.data || []);
    });
  }, []);

  const revenueByCity = useMemo(() => {
    const totals = new Map<string, number>();
    orders.forEach((order) => {
      const city = order.customer_city || order.delivery_address?.city || 'Unknown';
      totals.set(city, (totals.get(city) || 0) + Number(order.total_amount || 0));
    });
    return Array.from(totals.entries())
      .map(([city, revenue]) => ({ city, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const topSellingByCity = useMemo(() => {
    const perCity = new Map<string, Map<string, number>>();
    orders.forEach((order) => {
      const city = order.customer_city || order.delivery_address?.city || 'Unknown';
      const cityMap = perCity.get(city) || new Map<string, number>();
      (Array.isArray(order.products) ? order.products : []).forEach((item: any) => {
        cityMap.set(item.name, (cityMap.get(item.name) || 0) + Number(item.quantity || 0));
      });
      perCity.set(city, cityMap);
    });

    return Array.from(perCity.entries()).map(([city, cityMap]) => ({
      city,
      products: Array.from(cityMap.entries())
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3),
    }));
  }, [orders]);

  const unmetDemandCities = useMemo(() => {
    const hubCities = new Set(hubs.map((hub) => String(hub.city_name).toLowerCase()));
    const demand = new Map<string, number>();
    notifyRequests.forEach((request) => {
      const city = (request.city || request.pincode || 'Unknown').trim();
      if (!city || hubCities.has(city.toLowerCase())) {
        return;
      }
      demand.set(city, (demand.get(city) || 0) + 1);
    });
    return Array.from(demand.entries())
      .map(([city, requests]) => ({ city, requests }))
      .sort((a, b) => b.requests - a.requests);
  }, [hubs, notifyRequests]);

  const monthOnMonth = useMemo(() => {
    const result = new Map<string, { current: number; previous: number }>();
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
    const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousKey = `${previousDate.getFullYear()}-${previousDate.getMonth()}`;

    orders.forEach((order) => {
      const city = order.customer_city || order.delivery_address?.city || 'Unknown';
      const orderDate = new Date(order.created_at);
      const orderKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
      const current = result.get(city) || { current: 0, previous: 0 };
      if (orderKey === currentKey) {
        current.current += Number(order.total_amount || 0);
      } else if (orderKey === previousKey) {
        current.previous += Number(order.total_amount || 0);
      }
      result.set(city, current);
    });

    return Array.from(result.entries()).map(([city, totals]) => ({
      city,
      current: totals.current,
      previous: totals.previous,
      growth: totals.previous > 0 ? Math.round(((totals.current - totals.previous) / totals.previous) * 100) : 100,
    }));
  }, [orders]);

  const maxRevenue = revenueByCity[0]?.revenue || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Admin Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Multi-city demand, revenue, hub growth, and unserved market visibility from the hub network.</p>
        </div>
        <Button onClick={() => navigate('/admin/hubs')} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          Manage Hub Network
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active Hubs</p><p className="font-display text-2xl font-bold mt-1">{hubs.filter((hub) => hub.is_active).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Orders</p><p className="font-display text-2xl font-bold mt-1">{orders.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Products</p><p className="font-display text-2xl font-bold mt-1">{products.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Revenue</p><p className="font-display text-2xl font-bold mt-1">{currency(orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0))}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Notify-me Requests</p><p className="font-display text-2xl font-bold mt-1">{notifyRequests.length}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Revenue by City</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {revenueByCity.length === 0 ? <p className="text-sm text-muted-foreground">No routed orders yet.</p> : revenueByCity.map((row) => (
              <div key={row.city} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{row.city}</span>
                  <span className="text-muted-foreground">{currency(row.revenue)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${Math.max((row.revenue / maxRevenue) * 100, 8)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><Package className="w-5 h-5" /> Top Selling Products by City</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {topSellingByCity.length === 0 ? <p className="text-sm text-muted-foreground">No city sales data yet.</p> : topSellingByCity.map((row) => (
              <div key={row.city} className="rounded-md border p-3">
                <p className="font-medium">{row.city}</p>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {row.products.map((product) => <p key={`${row.city}-${product.name}`}>{product.name} · {product.quantity} units</p>)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><MapPinned className="w-5 h-5" /> Cities with Demand but No Hub</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {unmetDemandCities.length === 0 ? <p className="text-sm text-muted-foreground">No uncovered city demand yet.</p> : unmetDemandCities.map((row) => (
              <div key={row.city} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>{row.city}</span>
                <span className="text-muted-foreground">{row.requests} notify-me requests</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Month on Month Growth per Hub City</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {monthOnMonth.length === 0 ? <p className="text-sm text-muted-foreground">Need at least one month of routed order history.</p> : monthOnMonth.map((row) => (
              <div key={row.city} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{row.city}</p>
                  <p className={`text-sm ${row.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{row.growth}%</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Current: {currency(row.current)} · Previous: {currency(row.previous)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
