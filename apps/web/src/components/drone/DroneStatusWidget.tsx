'use client';

import { useEffect, useState } from 'react';
import { Battery, BatteryLow, BatteryMedium, BatteryFull, MapPin, Wifi, WifiOff, Zap } from 'lucide-react';

interface DroneStatus {
  id: string;
  serialNumber: string;
  model: string;
  status: 'idle' | 'busy' | 'offline' | 'charging' | 'maintenance';
  batteryPercent: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  speed?: number;
  altitude?: number;
  currentOrderId?: string;
}

// Mock drones — real data comes from drone-service WebSocket
const MOCK_DRONES: DroneStatus[] = [
  {
    id: '1',
    serialNumber: 'AG-001',
    model: 'Airo X1',
    status: 'busy',
    batteryPercent: 78,
    latitude: 41.2995,
    longitude: 69.2401,
    address: 'Yunusabad, Tashkent',
    speed: 42,
    altitude: 85,
    currentOrderId: 'ORD-4821',
  },
  {
    id: '2',
    serialNumber: 'AG-002',
    model: 'Airo X1',
    status: 'idle',
    batteryPercent: 95,
    latitude: 41.3111,
    longitude: 69.2797,
    address: 'Chilonzor, Tashkent',
    speed: 0,
    altitude: 0,
  },
  {
    id: '3',
    serialNumber: 'AG-003',
    model: 'Airo X2 Pro',
    status: 'charging',
    batteryPercent: 34,
    address: 'Base Station — Mirzo Ulugbek',
    speed: 0,
    altitude: 0,
  },
  {
    id: '4',
    serialNumber: 'AG-004',
    model: 'Airo X2 Pro',
    status: 'offline',
    batteryPercent: 12,
    address: 'Maintenance Depot',
    speed: 0,
    altitude: 0,
  },
];

const STATUS_CONFIG = {
  idle:        { label: 'Idle',        color: 'text-brand-400',  bg: 'bg-brand-500/10  border-brand-500/20',  dot: 'bg-brand-400'   },
  busy:        { label: 'In Flight',   color: 'text-blue-400',   bg: 'bg-blue-500/10   border-blue-500/20',   dot: 'bg-blue-400 animate-pulse' },
  charging:    { label: 'Charging',    color: 'text-amber-400',  bg: 'bg-amber-500/10  border-amber-500/20',  dot: 'bg-amber-400 animate-pulse' },
  offline:     { label: 'Offline',     color: 'text-gray-500',   bg: 'bg-gray-500/10   border-gray-500/20',   dot: 'bg-gray-500'    },
  maintenance: { label: 'Maintenance', color: 'text-red-400',    bg: 'bg-red-500/10    border-red-500/20',    dot: 'bg-red-400'     },
};

function BatteryIcon({ pct }: { pct: number }) {
  if (pct > 60) return <BatteryFull  className="w-4 h-4 text-brand-400" />;
  if (pct > 25) return <BatteryMedium className="w-4 h-4 text-amber-400" />;
  return             <BatteryLow   className="w-4 h-4 text-red-400" />;
}

function BatteryBar({ pct }: { pct: number }) {
  const color = pct > 60 ? 'bg-brand-500' : pct > 25 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-dark-300 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium w-8 text-right ${pct > 60 ? 'text-brand-400' : pct > 25 ? 'text-amber-400' : 'text-red-400'}`}>
        {pct}%
      </span>
    </div>
  );
}

export function DroneStatusWidget() {
  const [drones, setDrones] = useState<DroneStatus[]>(MOCK_DRONES);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Simulate live battery drain for busy drones
  useEffect(() => {
    const interval = setInterval(() => {
      setDrones(prev => prev.map(d => ({
        ...d,
        batteryPercent: d.status === 'busy'
          ? Math.max(10, d.batteryPercent - 0.1)
          : d.status === 'charging'
          ? Math.min(100, d.batteryPercent + 0.5)
          : d.batteryPercent,
      })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const active  = drones.filter(d => d.status === 'busy').length;
  const idle    = drones.filter(d => d.status === 'idle').length;
  const offline = drones.filter(d => d.status === 'offline').length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'In Flight', value: active,  color: 'text-blue-400',  bg: 'bg-blue-500/10'  },
          { label: 'Ready',     value: idle,    color: 'text-brand-400', bg: 'bg-brand-500/10' },
          { label: 'Offline',   value: offline, color: 'text-gray-400',  bg: 'bg-gray-500/10'  },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Drone list */}
      {drones.map(drone => {
        const cfg = STATUS_CONFIG[drone.status];
        const isOpen = expanded === drone.id;

        return (
          <div
            key={drone.id}
            className={`rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${cfg.bg} ${isOpen ? 'ring-1 ring-white/10' : 'hover:brightness-110'}`}
            onClick={() => setExpanded(isOpen ? null : drone.id)}
          >
            {/* Header row */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="text-2xl">🚁</div>
                {drone.status === 'busy' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{drone.serialNumber}</span>
                  <span className={`text-xs ${cfg.color}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{drone.model}</p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <BatteryIcon pct={Math.round(drone.batteryPercent)} />
                <span className={`text-xs font-medium ${drone.batteryPercent > 60 ? 'text-brand-400' : drone.batteryPercent > 25 ? 'text-amber-400' : 'text-red-400'}`}>
                  {Math.round(drone.batteryPercent)}%
                </span>
              </div>
            </div>

            {/* Battery bar */}
            <div className="mt-3">
              <BatteryBar pct={Math.round(drone.batteryPercent)} />
            </div>

            {/* Expanded details */}
            {isOpen && (
              <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                {drone.address && (
                  <div className="flex items-start gap-2 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-brand-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{drone.address}</span>
                  </div>
                )}
                {drone.latitude && drone.longitude && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>📍 {drone.latitude.toFixed(4)}, {drone.longitude.toFixed(4)}</span>
                  </div>
                )}
                {drone.status === 'busy' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-black/20 rounded-lg p-2 text-center">
                      <p className="text-white font-semibold text-sm">{drone.speed} km/h</p>
                      <p className="text-gray-500 text-xs">Speed</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2 text-center">
                      <p className="text-white font-semibold text-sm">{drone.altitude}m</p>
                      <p className="text-gray-500 text-xs">Altitude</p>
                    </div>
                  </div>
                )}
                {drone.currentOrderId && (
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-300">Delivering order {drone.currentOrderId}</span>
                  </div>
                )}
                {drone.status === 'charging' && (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Charging... ETA {Math.round((100 - drone.batteryPercent) * 2)} min</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

