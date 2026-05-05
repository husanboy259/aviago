import Link from 'next/link';
import { DroneStatusWidget } from '@/components/drone/DroneStatusWidget';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-dark">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-dark-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚁</span>
          <span className="text-xl font-black text-white tracking-tight">
            Airo<span className="text-brand-500">Go</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"  className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">Sign In</Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-4">Get Started</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left — Hero */}
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-brand-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            Live drone deliveries in Tashkent
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
            Food delivered<br />
            <span className="text-brand-500">by drone</span><br />
            in 20 min
          </h1>

          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Airo Go connects you with local restaurants and delivers your order
            via autonomous drone — faster than any courier.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/signup"      className="btn-primary text-center text-base py-4 px-8">
              Order Now →
            </Link>
            <Link href="/restaurants" className="btn-secondary text-center text-base py-4 px-8">
              Browse Restaurants
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10 pt-10 border-t border-dark-200">
            {[
              { value: '18 min', label: 'Avg delivery' },
              { value: '50+',    label: 'Restaurants'  },
              { value: '99.2%',  label: 'On-time rate' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-brand-400">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Live Drone Status */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white text-lg">🚁 Live Fleet Status</h2>
            <span className="flex items-center gap-1.5 text-xs text-brand-400">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              Real-time
            </span>
          </div>
          <DroneStatusWidget />
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '⚡', title: 'Lightning Fast',   desc: 'Drones fly at 80 km/h — no traffic', color: 'text-amber-400'  },
            { icon: '📍', title: 'Live Tracking',    desc: 'Watch your drone on the map in real-time', color: 'text-blue-400' },
            { icon: '🔒', title: 'Secure Payments',  desc: 'Payme, Click, Uzcard & Humo', color: 'text-brand-400' },
          ].map(f => (
            <div key={f.title} className="card hover:border-brand-500/40 transition-all group">
              <div className={`text-3xl mb-3 ${f.color}`}>{f.icon}</div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-brand-400 transition-colors">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}
