'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/lib/api';
import { getOrderSocket, getTrackingSocket } from '@/lib/socket';
import { CustomerNav } from '@/components/layout/CustomerNav';
import { useCartStore } from '@/store/cart.store';
import { CheckCircle, Clock, Package, Truck, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/tracking/LiveMap'), { ssr: false });

const STATUS_STEPS = [
  { key: 'pending',    label: 'Pending',     icon: Clock },
  { key: 'accepted',   label: 'Accepted',    icon: CheckCircle },
  { key: 'preparing',  label: 'Preparing',   icon: Package },
  { key: 'dispatched', label: 'Dispatched',  icon: Truck },
  { key: 'in_flight',  label: 'In Flight',   icon: Truck },
  { key: 'delivered',  label: 'Delivered',   icon: CheckCircle },
];

function fmt(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + ' UZS';
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const cartCount = useCartStore((s) => s.itemCount());

  const [droneLocation, setDroneLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [liveOrder, setLiveOrder] = useState<any>(null);

  const { data: order, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.get(id).then((r) => r.data),
    refetchInterval: 15_000,
  });

  const displayOrder = liveOrder || order;

  useEffect(() => {
    const orderSocket = getOrderSocket();
    const trackSocket = getTrackingSocket();

    orderSocket.emit('subscribe:order', id);
    orderSocket.on('order:status', (updated: any) => {
      if (updated.id === id) setLiveOrder(updated);
    });

    if (order?.droneId) {
      trackSocket.emit('track:drone', order.droneId);
      trackSocket.on('drone:location', (loc: any) => {
        if (loc.droneId === order.droneId) {
          setDroneLocation({ lat: loc.latitude, lng: loc.longitude });
        }
      });
    }

    return () => {
      orderSocket.off('order:status');
      trackSocket.off('drone:location');
    };
  }, [id, order?.droneId]);

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === displayOrder?.status);

  return (
    <div className="min-h-screen bg-dark">
      <CustomerNav cartCount={cartCount} />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Status tracker */}
        <div className="card">
          <h2 className="font-semibold text-white mb-6">Order #{id?.slice(0, 8).toUpperCase()}</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-dark-200" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-brand-500 transition-all duration-500"
              style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
            />
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStepIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-brand-500 border-brand-500' : 'bg-dark border-dark-300'}`}>
                    <Icon className={`w-4 h-4 ${done ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${done ? 'text-brand-400' : 'text-gray-600'}`}>{step.label}</span>
                </div>
              );
            })}
          </div>

          {displayOrder?.status === 'delivered' && (
            <div className="mt-6 text-center py-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <p className="text-green-400 font-semibold">🎉 Your order has been delivered!</p>
            </div>
          )}
        </div>

        {/* Live map */}
        {(displayOrder?.status === 'in_flight' || displayOrder?.status === 'dispatched') && (
          <div className="card p-0 overflow-hidden rounded-2xl h-72">
            <LiveMap
              droneLocation={droneLocation}
              destination={displayOrder?.deliveryAddress}
            />
          </div>
        )}

        {/* Order details */}
        {displayOrder && (
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Order Details</h3>
            <div className="space-y-2">
              {displayOrder.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-300">{item.name} × {item.quantity}</span>
                  <span className="text-gray-400">{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-dark-200 pt-2 mt-2 flex justify-between font-semibold text-white">
                <span>Total</span>
                <span className="text-brand-400">{fmt(displayOrder.total)}</span>
              </div>
            </div>

            {displayOrder.deliveryAddress && (
              <div className="mt-4 flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                <span>{displayOrder.deliveryAddress.street}, {displayOrder.deliveryAddress.city}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
