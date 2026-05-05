'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, restaurantApi } from '@/lib/api';
import { getOrderSocket } from '@/lib/socket';
import toast from 'react-hot-toast';
import { Package, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

function fmt(n: number) { return new Intl.NumberFormat('uz-UZ').format(n) + ' UZS'; }

const STATUS_ACTIONS: Record<string, { label: string; next: string }[]> = {
  pending:    [{ label: 'Accept',  next: 'accepted' }, { label: 'Reject', next: 'cancelled' }],
  accepted:   [{ label: 'Start Preparing', next: 'preparing' }],
  preparing:  [{ label: 'Ready for Pickup', next: 'dispatched' }],
  dispatched: [],
  delivered:  [],
  cancelled:  [],
};

export default function RestaurantDashboard() {
  const qc = useQueryClient();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);

  const { data: dashboard } = useQuery({
    queryKey: ['restaurant-dashboard'],
    queryFn: () => restaurantApi.dashboard().then((r) => r.data),
  });

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['restaurant-orders', restaurantId],
    queryFn: () => restaurantId ? orderApi.restaurant(restaurantId).then((r) => r.data?.data || []) : [],
    enabled: !!restaurantId,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (dashboard?.restaurants?.length) {
      const rid = dashboard.restaurants[0].id;
      setRestaurantId(rid);

      const socket = getOrderSocket();
      socket.emit('subscribe:restaurant', rid);
      socket.on('order:new', (order: any) => {
        toast.custom((t) => (
          <div className={`card border-brand-500 ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
            <p className="font-semibold text-white">🔔 New Order!</p>
            <p className="text-sm text-gray-400">{order.items?.length} items · {fmt(order.total)}</p>
          </div>
        ));
        setLiveOrders((prev) => [order, ...prev]);
        qc.invalidateQueries({ queryKey: ['restaurant-orders'] });
      });
      socket.on('order:status', () => qc.invalidateQueries({ queryKey: ['restaurant-orders'] }));

      return () => { socket.off('order:new'); socket.off('order:status'); };
    }
  }, [dashboard]);

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      orderApi.updateStatus(orderId, status),
    onSuccess: () => { toast.success('Order updated'); qc.invalidateQueries({ queryKey: ['restaurant-orders'] }); },
    onError: () => toast.error('Failed to update order'),
  });

  const orders = (ordersData || []) as any[];
  const active = orders.filter((o: any) => !['delivered', 'cancelled', 'failed'].includes(o.status));
  const completed = orders.filter((o: any) => o.status === 'delivered');

  return (
    <div className="min-h-screen bg-dark">
      <nav className="sticky top-0 bg-dark-100 border-b border-dark-200 px-6 h-14 flex items-center justify-between z-10">
        <h1 className="font-bold text-white">🍽️ Restaurant Dashboard</h1>
        {dashboard?.restaurants?.[0] && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{dashboard.restaurants[0].name}</span>
            <button
              onClick={() => restaurantApi.toggle(dashboard.restaurants[0].id, !dashboard.restaurants[0].isOpen)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${dashboard.restaurants[0].isOpen ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
            >
              {dashboard.restaurants[0].isOpen ? '● Open' : '● Closed'}
            </button>
          </div>
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Package,    label: 'Active Orders',    value: active.length,           color: 'text-brand-400' },
            { icon: CheckCircle,label: 'Delivered Today',  value: completed.length,        color: 'text-green-400' },
            { icon: TrendingUp, label: 'Total Orders',     value: dashboard?.totalOrders || 0, color: 'text-purple-400' },
            { icon: Clock,      label: 'Restaurants',      value: dashboard?.totalRestaurants || 0, color: 'text-orange-400' },
          ].map((s) => (
            <div key={s.label} className="card">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Active Orders */}
        <div>
          <h2 className="font-semibold text-white mb-4">Active Orders</h2>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-dark-100 rounded-2xl animate-pulse" />)}</div>
          ) : active.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-5xl mb-3">📭</div>
              <p>No active orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((order: any) => (
                <div key={order.id} className="card border-l-4 border-l-brand-500">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white">#{order.id.slice(0, 8).toUpperCase()}</span>
                        <span className={`status-${order.status}`}>{order.status}</span>
                      </div>
                      <div className="mt-2 space-y-0.5">
                        {order.items?.map((item: any) => (
                          <p key={item.id} className="text-sm text-gray-400">{item.name} × {item.quantity}</p>
                        ))}
                      </div>
                      <p className="text-brand-400 font-medium mt-2 text-sm">{fmt(order.total)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {STATUS_ACTIONS[order.status]?.map((action) => (
                        <button
                          key={action.next}
                          onClick={() => statusMutation.mutate({ orderId: order.id, status: action.next })}
                          className={action.next === 'cancelled' ? 'btn-secondary text-xs py-1.5 px-3 text-red-400' : 'btn-primary text-xs py-1.5 px-3'}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
