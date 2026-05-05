'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { droneApi } from '@/lib/api';
import { getTrackingSocket } from '@/lib/socket';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { Battery, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';

const LiveMap = dynamic(() => import('@/components/tracking/LiveMap'), { ssr: false });

const STATUS_COLORS: Record<string, string> = {
  idle:        'text-green-400  bg-green-400/10',
  busy:        'text-blue-400   bg-blue-400/10',
  offline:     'text-gray-400   bg-gray-400/10',
  maintenance: 'text-yellow-400 bg-yellow-400/10',
  charging:    'text-purple-400 bg-purple-400/10',
};

export default function OperatorPanel() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [liveLocations, setLiveLocations] = useState<Record<string, { lat: number; lng: number }>>({});

  const { data: drones = [], isLoading } = useQuery({
    queryKey: ['drones'],
    queryFn: () => droneApi.list().then((r) => r.data),
    refetchInterval: 10_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => droneApi.updateStatus(id, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['drones'] }); },
    onError: () => toast.error('Failed to update status'),
  });

  // Subscribe to live telemetry for all drones
  useEffect(() => {
    const socket = getTrackingSocket();
    (drones as any[]).forEach((d: any) => socket.emit('track:drone', d.id));

    socket.on('drone:location', (loc: any) => {
      setLiveLocations((prev) => ({ ...prev, [loc.droneId]: { lat: loc.latitude, lng: loc.longitude } }));
    });

    return () => { socket.off('drone:location'); };
  }, [(drones as any[]).length]);

  function getBatteryColor(pct: number) {
    if (pct > 50) return 'text-green-400';
    if (pct > 20) return 'text-yellow-400';
    return 'text-red-400';
  }

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Left: drone list */}
      <aside className="w-80 bg-dark-100 border-r border-dark-200 flex flex-col">
        <div className="p-4 border-b border-dark-200">
          <h1 className="font-bold text-white text-lg">🚁 Fleet Control</h1>
          <p className="text-xs text-gray-400 mt-0.5">{(drones as any[]).filter((d: any) => d.status === 'idle').length} drones available</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-dark-200 rounded-xl animate-pulse" />)
            : (drones as any[]).map((drone: any) => {
                const live = liveLocations[drone.id];
                return (
                  <button
                    key={drone.id}
                    onClick={() => setSelected(drone)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${selected?.id === drone.id ? 'border-brand-500 bg-brand-500/10' : 'border-dark-200 hover:border-dark-300'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white font-medium text-sm">{drone.model}</p>
                        <p className="text-xs text-gray-500">{drone.serialNumber}</p>
                      </div>
                      <span className={`badge ${STATUS_COLORS[drone.status] || 'text-gray-400'}`}>
                        {drone.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`flex items-center gap-1 text-xs ${getBatteryColor(drone.batteryPercent)}`}>
                        <Battery className="w-3 h-3" />
                        {drone.batteryPercent}%
                      </span>
                      {live
                        ? <span className="flex items-center gap-1 text-xs text-green-400"><Wifi className="w-3 h-3" /> Live</span>
                        : <span className="flex items-center gap-1 text-xs text-gray-500"><WifiOff className="w-3 h-3" /> No signal</span>
                      }
                    </div>
                  </button>
                );
              })}
        </div>
      </aside>

      {/* Right: map + controls */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          {selected ? (
            <LiveMap
              droneLocation={liveLocations[selected.id] || null}
              destination={undefined}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-5xl mb-3">🚁</div>
                <p>Select a drone to track</p>
              </div>
            </div>
          )}
        </div>

        {/* Drone detail controls */}
        {selected && (
          <div className="bg-dark-100 border-t border-dark-200 p-4">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{selected.model}</h3>
                  <p className="text-xs text-gray-400">{selected.serialNumber}</p>
                </div>
                <div className="flex gap-2">
                  {selected.status !== 'idle' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: selected.id, status: 'idle' })}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      Set Idle
                    </button>
                  )}
                  {selected.status !== 'offline' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: selected.id, status: 'offline' })}
                      className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-1.5 px-3 rounded-xl hover:bg-red-500/20 transition-colors"
                    >
                      Take Offline
                    </button>
                  )}
                  {selected.status === 'offline' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: selected.id, status: 'idle' })}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      Bring Online
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                {[
                  { label: 'Battery', value: `${selected.batteryPercent}%` },
                  { label: 'Status', value: selected.status },
                  { label: 'Max Payload', value: `${selected.maxPayloadGrams}g` },
                  { label: 'Max Range', value: `${selected.maxRangeKm}km` },
                ].map((s) => (
                  <div key={s.label} className="bg-dark-200 rounded-xl p-2">
                    <p className="text-gray-500">{s.label}</p>
                    <p className="text-white font-medium mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
