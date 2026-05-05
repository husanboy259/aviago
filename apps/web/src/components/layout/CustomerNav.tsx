'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Props {
  cartCount?: number;
}

export function CustomerNav({ cartCount = 0 }: Props) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  async function handleLogout() {
    try { await authApi.logout(); } catch {}
    logout();
    toast.success('Signed out');
    router.push('/');
  }

  return (
    <nav className="sticky top-0 z-50 bg-dark/95 backdrop-blur-sm border-b border-dark-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-white">
          Airo<span className="text-brand-500">Go</span>
          <span className="ml-1 text-lg">🚁</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/restaurants" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
            Restaurants
          </Link>

          {isAuthenticated && (
            <Link href="/orders/my" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              My Orders
            </Link>
          )}

          <Link href="/cart" className="relative p-2 text-gray-400 hover:text-white transition-colors">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-medium">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/profile" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <User className="w-4 h-4" />
                <span className="hidden sm:block">{user?.firstName}</span>
              </Link>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary py-2 px-4 text-sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

