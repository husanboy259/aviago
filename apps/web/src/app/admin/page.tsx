'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { TrendingUp, Users, Package, Truck, ShoppingBag, DollarSign } from 'lucide-react';
import Link from 'next/link';

function fmt(n: number) { return new Intl.NumberFormat('uz-UZ').format(Math.round(n)); }
function fmtRevenue(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }: any) {
  const colors: Record<string, string> = {
    brand: 'text-brand-500 bg-brand-500/10',
    green: 'text-green-400 bg-green-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
    orange: 'text-orange-400 bg-orange-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
    yellow: 'text-yellow-400 bg-yellow-400/10',
  };
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data),
  });

  const { data: trend } = useQuery({
    queryKey: ['analytics-trend'],
    queryFn: () => analyticsApi.trend(30).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-gray-400">Loading dashboardвЂ¦</div>
      </div>
    );
  }

  const { revenue, delivery, users, topRestaurants } = data || {};

  return (
    <div className="min-h-screen bg-dark">
      {/* Sidebar + main layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 min-h-screen bg-dark-100 border-r border-dark-200 p-4 flex-shrink-0 hidden lg:flex flex-col gap-1">
          <div className="font-bold text-xl text-white mb-6 px-2">
            Airo<span class="text-brand-500">Go</span> Admin
          </div>
          {[
            { href: '/admin', label: 'Dashboard', icon: 'рџ“Љ' },
            { href: '/admin/restaurants', label: 'Restaurants', icon: 'рџЌЅпёЏ' },
            { href: '/admin/orders', label: 'Orders', icon: 'рџ“¦' },
            { href: '/admin/drones', label: 'Fleet', icon: 'рџљЃ' },
            { href: '/admin/users', label: 'Users', icon: 'рџ‘Ґ' },
            { href: '/admin/analytics', label: 'Analytics', icon: 'рџ“€' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-dark-200 transition-colors text-sm"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h1>

          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <StatCard icon={DollarSign}  label="Daily Revenue"    value={`${fmtRevenue(revenue?.dailyRevenue)} UZS`}   color="brand"  />
            <StatCard icon={ShoppingBag} label="Total Orders"     value={fmt(revenue?.totalOrders)}                    color="blue"   />
            <StatCard icon={TrendingUp}  label="Completion Rate"  value={`${revenue?.completionRate}%`}                color="green"  sub={`${revenue?.completedOrders} delivered`} />
            <StatCard icon={Truck}       label="Avg Delivery"     value={`${delivery?.avgDeliveryMinutes} min`}         color="purple" />
            <StatCard icon={Users}       label="Active Today"     value={fmt(users?.activeUsersToday)}                 color="orange" />
            <StatCard icon={Package}     label="Drones Active"    value={`${delivery?.dronesOnDelivery}/${delivery?.activeDrones}`} color="yellow" />
          </div>

          {/* Revenue trend chart */}
          <div className="card mb-6">
            <h2 className="font-semibold text-white mb-4">Revenue Trend (30 days)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend || []}>
                <defs>
                  <linearGradient id="brandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00AEEF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00AEEF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
                <YAxis tickFormatter={(v) => fmtRevenue(v)} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 8 }}
                  formatter={(v: any) => [`${fmtRevenue(v)} UZS`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#00AEEF" fill="url(#brandGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders per day + Top Restaurants */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold text-white mb-4">Orders per Day</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(trend || []).slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 8 }} />
                  <Bar dataKey="orders" fill="#00AEEF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2 className="font-semibold text-white mb-4">Top Restaurants</h2>
              <div className="space-y-3">
                {(topRestaurants || []).slice(0, 5).map((r: any, i: number) => (
                  <div key={r.restaurantId} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-white font-medium">{r.name}</span>
                        <span className="text-gray-400">{fmt(r.orders)} orders</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-dark-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${(r.orders / (topRestaurants?.[0]?.orders || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

