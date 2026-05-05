'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  active:           'text-green-400  bg-green-400/10',
  pending_approval: 'text-yellow-400 bg-yellow-400/10',
  inactive:         'text-gray-400   bg-gray-400/10',
  suspended:        'text-red-400    bg-red-400/10',
};

export default function AdminRestaurantsPage() {
  const qc = useQueryClient();

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => restaurantApi.list({ limit: 100 }).then((r) => r.data?.data || []),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => restaurantApi.approve(id, status),
    onSuccess: () => { toast.success('Restaurant updated'); qc.invalidateQueries({ queryKey: ['admin-restaurants'] }); },
    onError: () => toast.error('Update failed'),
  });

  return (
    <div className="min-h-screen bg-dark p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Restaurants</h1>
        <p className="text-gray-400 text-sm mt-0.5">Approve, suspend, and manage all restaurants</p>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-200">
              {['Name', 'Owner', 'Status', 'Rating', 'Orders', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-dark-200">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-dark-200 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : (restaurants as any[]).map((r: any) => (
                  <tr key={r.id} className="border-b border-dark-200 hover:bg-dark-200/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white text-sm">{r.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[180px]">{r.address}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{r.ownerId?.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_STYLE[r.status] || 'text-gray-400'}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-yellow-400 text-sm">★ {r.rating || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{r.totalOrders}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.status === 'pending_approval' && (
                          <button
                            onClick={() => approveMutation.mutate({ id: r.id, status: 'active' })}
                            className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {r.status === 'active' && (
                          <button
                            onClick={() => approveMutation.mutate({ id: r.id, status: 'suspended' })}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Suspend
                          </button>
                        )}
                        {r.status === 'suspended' && (
                          <button
                            onClick={() => approveMutation.mutate({ id: r.id, status: 'active' })}
                            className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Reinstate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
