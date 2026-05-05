'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { orderApi } from '@/lib/api';
import { CustomerNav } from '@/components/layout/CustomerNav';
import { useCartStore } from '@/store/cart.store';
import { Package, Clock, ChevronRight } from 'lucide-react';

function fmt(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + ' UZS';
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: 'status-pending'    },
  accepted:   { label: 'Accepted',   color: 'status-accepted'   },
  preparing:  { label: 'Preparing',  color: 'status-preparing'  },
  dispatched: { label: 'Dispatched', color: 'status-dispatched' },
  in_flight:  { label: 'In Flight',  color: 'status-in_flight'  },
  delivered:  { label: 'Delivered',  color: 'status-delivered'  },
  cancelled:  { label: 'Cancelled',  color: 'status-cancelled'  },
};

export default function MyOrdersPage() {
  const cartCount = useCartStore((s) => s.itemCount());

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderApi.myOrders().then((r) => r.data?.data || []),
  });

  return (
    <div className="min-h-screen bg-dark">
      <CustomerNav cartCount={cartCount} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">My Orders</h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-dark-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (orders as any[]).length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <div className="text-6xl mb-4">📦</div>
            <p className="mb-4">No orders yet</p>
            <Link href="/restaurants" className="btn-primary">Order now</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(orders as any[]).map((order: any) => {
              const st = STATUS_LABELS[order.status] || { label: order.status, color: 'badge' };
              const isActive = !['delivered', 'cancelled', 'failed'].includes(order.status);
              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className={`card hover:border-brand-500 transition-all cursor-pointer flex items-center gap-4 ${isActive ? 'border-brand-500/40' : ''}`}>
                    <div className={`p-2.5 rounded-xl ${isActive ? 'bg-brand-500/10' : 'bg-dark-200'}`}>
                      <Package className={`w-5 h-5 ${isActive ? 'text-brand-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={st.color}>{st.label}</span>
                      </div>
                      <p className="text-gray-400 text-sm truncate">
                        {order.restaurantName} · {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-brand-400 font-semibold text-sm">{fmt(order.total)}</span>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
