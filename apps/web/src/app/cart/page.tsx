'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart.store';
import { addressApi, orderApi } from '@/lib/api';
import { Minus, Plus, Trash2, MapPin, ArrowLeft } from 'lucide-react';
import { CustomerNav } from '@/components/layout/CustomerNav';

const PAYMENT_METHODS = [
  { value: 'payme',  label: 'Payme',  emoji: 'P' },
  { value: 'click',  label: 'Click',  emoji: 'C' },
  { value: 'uzcard', label: 'Uzcard', emoji: 'U' },
  { value: 'humo',   label: 'Humo',   emoji: 'H' },
  { value: 'cash',   label: 'Cash',   emoji: '$' },
];

function fmt(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + ' UZS';
}

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, total, itemCount, restaurantId } = useCartStore();
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('payme');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressApi.list().then((r) => r.data),
  });

  const DELIVERY_FEE = 15_000;

  async function handlePlaceOrder() {
    if (!selectedAddress) { toast.error('Select a delivery address'); return; }
    if (!items.length) { toast.error('Your cart is empty'); return; }

    setLoading(true);
    try {
      const { data } = await orderApi.create({
        restaurantId,
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        deliveryAddressId: selectedAddress,
        paymentMethod,
        notes: notes || undefined,
      });
      clearCart();
      toast.success('Order placed!');
      router.push(`/orders/${data.id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <div className="min-h-screen bg-dark">
        <CustomerNav cartCount={0} />
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <div className="text-6xl mb-4">🛒</div>
          <p className="mb-6">Your cart is empty</p>
          <button onClick={() => router.push('/restaurants')} className="btn-primary">Browse Restaurants</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <CustomerNav cartCount={itemCount()} />

      <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to menu
          </button>

          <div className="card">
            <h2 className="font-semibold text-white mb-4">Order Items</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.menuItemId} className="flex items-center gap-3 py-2 border-b border-dark-200 last:border-0">
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-brand-400 text-sm">{fmt(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)} className="w-7 h-7 rounded-full bg-dark-200 flex items-center justify-center hover:bg-dark-300 transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} className="w-7 h-7 rounded-full bg-dark-200 flex items-center justify-center hover:bg-dark-300 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeItem(item.menuItemId)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors ml-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="w-20 text-right text-sm text-gray-300">{fmt(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-500" /> Delivery Address
            </h2>
            {(addresses as any[]).length > 0 ? (
              <div className="space-y-2">
                {(addresses as any[]).map((addr: any) => (
                  <label key={addr.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedAddress === addr.id ? 'border-brand-500 bg-brand-500/10' : 'border-dark-300 hover:border-dark-200'}`}>
                    <input type="radio" className="mt-0.5" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} />
                    <div>
                      <p className="text-white font-medium text-sm">{addr.label}</p>
                      <p className="text-gray-400 text-xs">{addr.street}, {addr.city}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-3">No addresses saved</p>
                <button onClick={() => router.push('/profile/addresses')} className="btn-secondary text-sm py-2">Add Address</button>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold text-white mb-4">Payment Method</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${paymentMethod === m.value ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-dark-300 text-gray-400 hover:border-dark-200'}`}
                >
                  <span className="font-bold text-brand-500">{m.emoji}</span>
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-white mb-3">Order Notes</h2>
            <textarea className="input resize-none" rows={2} placeholder="Any special requests?" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-semibold text-white mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{fmt(total())}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Delivery fee</span>
                <span>{fmt(DELIVERY_FEE)}</span>
              </div>
              <div className="border-t border-dark-200 pt-2 mt-2 flex justify-between font-semibold text-white">
                <span>Total</span>
                <span className="text-brand-400">{fmt(total() + DELIVERY_FEE)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading || !selectedAddress}
              className="btn-primary w-full mt-6"
            >
              {loading ? 'Placing order...' : 'Place Order - ' + fmt(total() + DELIVERY_FEE)}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">Drone delivery: ~20 min</p>
          </div>
        </div>
      </div>
    </div>
  );
}
