'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { droneApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Battery, Wifi, RefreshCw } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  idle:        'text-green-400  bg-green-400/10  border-green-400/20',
  busy:        'text-blue-400   bg-blue-400/10   border-blue-400/20',
  offline:     'text-gray-400   bg-gray-400/10   border-gray-400/20',
  maintenance: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  charging:    'text-purple-400 bg-purple-400/10 border-purple-400/20',
};

function BatteryBar({ pct }: { pct: number }) {
  const color = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-dark-300 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400">{pct}%</span>
    </div>
  );
}

export default function AdminDronesPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ serialNumber: '', model: '', maxPayloadGrams: 500, maxRangeKm: 10 });

  const { data: drones = [], isLoading } = useQuery({
    queryKey: ['admin-drones'],
    queryFn: () => droneApi.list().then((r) => r.data),
    refetchInterval: 15_000,
  });

  const createMutation = useMutation({
    mutationFn: () => droneApi.create(form),
    onSuccess: () => {
      toast.success('Drone registered');
      qc.invalidateQueries({ queryKey: ['admin-drones'] });
      setShowAdd(false);
      setForm({ serialNumber: '', model: '', maxPayloadGrams: 500, maxRangeKm: 10 });
    },
    onError: () => toast.error('Failed to register drone'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => droneApi.updateStatus(id, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['admin-drones'] }); },
  });

  const stats = {
    total:   (drones as any[]).length,
    idle:    (drones as any[]).filter((d: any) => d.status === 'idle').length,
    busy:    (drones as any[]).filter((d: any) => d.status === 'busy').length,
    offline: (drones as any[]).filter((d: any) => d.status === 'offline').length,
  };

  return (
    <div className="min-h-screen bg-dark p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Drone Fleet</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage and monitor all registered drones</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Register Drone
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',       value: stats.total,   color: 'text-white'         },
          { label: 'Idle',        value: stats.idle,    color: 'text-green-400'     },
          { label: 'On Delivery', value: stats.busy,    color: 'text-blue-400'      },
          { label: 'Offline',     value: stats.offline, color: 'text-gray-400'      },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add drone modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h2 className="font-semibold text-white mb-4">Register New Drone</h2>
            <div className="space-y-3">
              <input className="input" placeholder="Serial number (e.g. DD-2024-001)" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
              <input className="input" placeholder="Model (e.g. DJI Matrice 300)" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Max Payload (g)</label>
                  <input className="input" type="number" value={form.maxPayloadGrams} onChange={(e) => setForm({ ...form, maxPayloadGrams: +e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Max Range (km)</label>
                  <input className="input" type="number" value={form.maxRangeKm} onChange={(e) => setForm({ ...form, maxRangeKm: +e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn-primary flex-1" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Registering…' : 'Register'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drone table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-200">
              {['Model', 'Serial', 'Status', 'Battery', 'Max Payload', 'Max Range', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-dark-200">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-dark-200 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : (drones as any[]).map((drone: any) => (
                  <tr key={drone.id} className="border-b border-dark-200 hover:bg-dark-200/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white text-sm">{drone.model}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{drone.serialNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`badge border ${STATUS_COLORS[drone.status] || 'text-gray-400'}`}>
                        {drone.status}
                      </span>
                    </td>
                    <td className="px-4 py-3"><BatteryBar pct={+drone.batteryPercent} /></td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{drone.maxPayloadGrams}g</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{drone.maxRangeKm}km</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {drone.status === 'offline' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: drone.id, status: 'idle' })}
                            className="text-xs text-green-400 hover:text-green-300 transition-colors"
                          >
                            Bring Online
                          </button>
                        )}
                        {drone.status === 'idle' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: drone.id, status: 'charging' })}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            Charge
                          </button>
                        )}
                        {drone.status !== 'offline' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: drone.id, status: 'offline' })}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            Take Offline
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
