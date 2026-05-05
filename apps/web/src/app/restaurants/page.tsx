'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { restaurantApi } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { Search, ShoppingBag, Star, Clock, Truck } from 'lucide-react';
import { CustomerNav } from '@/components/layout/CustomerNav';

function formatPrice(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
}

export default function RestaurantsPage() {
  const [search, setSearch] = useState('');
  const cartCount = useCartStore((s) => s.itemCount());

  const { data, isLoading } = useQuery({
    queryKey: ['restaurants', search],
    queryFn: () => restaurantApi.list({ search: search || undefined }),
    select: (r) => r.data?.data || [],
  });

  return (
    <div className="min-h-screen bg-dark">
      <CustomerNav cartCount={cartCount} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            className="input pl-12"
            placeholder="Search restaurants or cuisine…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {['🍕 Pizza', '🍣 Sushi', '🥩 Grill', '🥗 Salads', '🍔 Burgers', '🍜 Asian', '🥙 Shawarma', '🍚 Plov'].map((cat) => (
            <button
              key={cat}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-dark-100 border border-dark-200
                         text-sm text-gray-300 hover:border-brand-500 hover:text-brand-500 transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Restaurant grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-40 bg-dark-200 rounded-xl mb-4" />
                <div className="h-4 bg-dark-200 rounded mb-2 w-3/4" />
                <div className="h-3 bg-dark-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data as any[])?.map((r: any) => (
              <Link key={r.id} href={`/restaurants/${r.id}`}>
                <div className="card group cursor-pointer hover:border-brand-500 transition-all duration-200 hover:-translate-y-1">
                  <div className="relative h-44 bg-dark-200 rounded-xl mb-4 overflow-hidden">
                    {r.coverUrl ? (
                      <Image src={r.coverUrl} alt={r.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                    )}
                    {!r.isOpen && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-300 bg-black/50 px-3 py-1 rounded-full">Closed</span>
                      </div>
                    )}
                    {r.isOpen && (
                      <span className="absolute top-2 right-2 badge bg-green-500/20 text-green-400">Open</span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors">
                        {r.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{r.description || r.categories?.join(', ')}</p>
                    </div>
                    {r.logoUrl && (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={r.logoUrl} alt="" fill className="object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {r.rating || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {r.estimatedDeliveryMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      {r.deliveryFee === 0 ? 'Free delivery' : formatPrice(r.deliveryFee)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && (!data || (data as any[]).length === 0) && (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">🍽️</div>
            <p>No restaurants found</p>
          </div>
        )}
      </div>
    </div>
  );
}
