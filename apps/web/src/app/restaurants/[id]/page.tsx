'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { restaurantApi, menuApi } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { Plus, Minus, ShoppingBag, ArrowLeft, Clock, Star } from 'lucide-react';
import { CustomerNav } from '@/components/layout/CustomerNav';

function formatPrice(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + ' UZS';
}

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem, updateQuantity, items, restaurantId, itemCount, total } = useCartStore();

  const { data: restaurant, isLoading: rLoading } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantApi.get(id),
    select: (r) => r.data,
  });

  const { data: menu } = useQuery({
    queryKey: ['menu', id],
    queryFn: () => menuApi.list(id),
    select: (r) => r.data as Record<string, any[]>,
  });

  function getQuantity(menuItemId: string) {
    return items.find((i) => i.menuItemId === menuItemId)?.quantity || 0;
  }

  function handleAdd(item: any) {
    if (restaurantId && restaurantId !== id) {
      if (!confirm('Your cart has items from another restaurant. Clear it?')) return;
    }
    addItem(id, restaurant?.name || '', {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
    });
    toast.success(`${item.name} added`);
  }

  if (rLoading) return <div className="min-h-screen bg-dark flex items-center justify-center text-gray-400">Loading…</div>;
  if (!restaurant) return <div className="min-h-screen bg-dark flex items-center justify-center text-gray-400">Restaurant not found</div>;

  return (
    <div className="min-h-screen bg-dark">
      <CustomerNav cartCount={itemCount()} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back button */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Restaurant header */}
        <div className="card mb-6">
          <div className="relative h-48 bg-dark-200 rounded-xl mb-4 overflow-hidden">
            {restaurant.coverUrl ? (
              <Image src={restaurant.coverUrl} alt={restaurant.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
            )}
          </div>
          <div className="flex items-start gap-4">
            {restaurant.logoUrl && (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-dark-300">
                <Image src={restaurant.logoUrl} alt="" fill className="object-cover" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{restaurant.name}</h1>
              <p className="text-gray-400 text-sm mt-1">{restaurant.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {restaurant.rating}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {restaurant.estimatedDeliveryMinutes} min</span>
                <span className={restaurant.isOpen ? 'text-green-400' : 'text-red-400'}>
                  {restaurant.isOpen ? '● Open' : '● Closed'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        {menu && Object.entries(menu).map(([category, menuItems]) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">{category}</h2>
            <div className="space-y-3">
              {menuItems.filter((i: any) => i.isAvailable).map((item: any) => {
                const qty = getQuantity(item.id);
                return (
                  <div key={item.id} className="card flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-dark-200">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🍴</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white">{item.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                      <p className="text-brand-400 font-semibold mt-1">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {qty > 0 ? (
                        <>
                          <button
                            onClick={() => updateQuantity(item.id, qty - 1)}
                            className="w-8 h-8 rounded-full bg-dark-200 border border-dark-300 flex items-center justify-center hover:border-brand-500 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-medium">{qty}</span>
                          <button
                            onClick={() => handleAdd(item)}
                            className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center hover:bg-brand-600 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAdd(item)}
                          disabled={!restaurant.isOpen}
                          className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center hover:bg-brand-600 transition-colors disabled:opacity-40"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky cart footer */}
      {itemCount() > 0 && restaurantId === id && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-100 border-t border-dark-200">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => router.push('/cart')}
              className="btn-primary w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                {itemCount()} items
              </span>
              <span>Go to cart → {formatPrice(total())}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
