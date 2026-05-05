'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { CustomerNav } from '@/components/layout/CustomerNav';
import { useCartStore } from '@/store/cart.store';
import { User, Phone, Mail, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.itemCount());

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName]   = useState(user?.lastName  || '');
  const [email, setEmail]         = useState(user?.email     || '');

  async function handleLogout() {
    try { await authApi.logout(); } catch {}
    logout();
    toast.success('Signed out');
    router.push('/');
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-dark">
      <CustomerNav cartCount={cartCount} />

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* Avatar + name */}
        <div className="card flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-brand-400" />
            )}
          </div>
          <div>
            <p className="font-semibold text-white text-lg">{user.firstName} {user.lastName}</p>
            <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3.5 h-3.5" /> {user.phone}
            </p>
            <span className="badge bg-brand-500/20 text-brand-400 mt-1">{user.role}</span>
          </div>
        </div>

        {/* Edit profile */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Edit Profile</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">First Name</label>
              <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Last Name</label>
              <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Email (optional)</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn-primary w-full" onClick={() => toast.success('Profile updated')}>
            Save Changes
          </button>
        </div>

        {/* Quick links */}
        <div className="card space-y-2">
          {[
            { href: '/orders/my',        label: 'My Orders',          icon: '📦' },
            { href: '/profile/addresses',label: 'Saved Addresses',    icon: '📍' },
          ].map((item) => (
            <a key={item.href} href={item.href}
               className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-200 transition-colors text-gray-300 hover:text-white">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </a>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
