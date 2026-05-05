'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Eye, EyeOff } from 'lucide-react';

const ROLES = [
  { value: 'customer',   emoji: 'U+1F6D2', label: 'Customer' },
  { value: 'restaurant', emoji: 'U+1F374', label: 'Restaurant' },
  { value: 'operator',   emoji: 'U+1F681', label: 'Operator' },
];

export default function SignUpPage() {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [loading,   setLoading]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [role,      setRole]      = useState('customer');

  async function handleSubmit() {
    if (!firstName.trim())    { toast.error('Ism kiriting'); return; }
    if (!lastName.trim())     { toast.error('Familiya kiriting'); return; }
    if (!email.includes('@')) { toast.error("Email noto'g'ri"); return; }
    if (password.length < 6)  { toast.error('Parol kamida 6 ta belgi'); return; }

    setLoading(true);
    try {
      const { data } = await authApi.register({ firstName, lastName, email, password, role });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Xush kelibsiz ' + firstName + '!');
      const paths: Record<string, string> = {
        admin: '/admin', restaurant: '/restaurant',
        operator: '/operator', customer: '/restaurants',
      };
      router.push(paths[data.user.role] || '/restaurants');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      if (msg?.includes('already')) toast.error('Bu email allaqachon royxatda');
      else toast.error(msg || 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">&#x1F681;</div>
          <h1 className="text-3xl font-bold text-white">Hisob yaratish</h1>
          <p className="text-gray-400 text-sm mt-1">
            <span className="text-brand-400 font-semibold">Airo Go</span> ga xush kelibsiz
          </p>
        </div>

        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Ism</label>
              <input className="input" placeholder="Ali" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Familiya</label>
              <input className="input" placeholder="Valiev" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
            <input type="email" className="input" placeholder="siz@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Parol</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="input pr-11"
                placeholder="Kamida 6 ta belgi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Men...</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'customer',   icon: '&#x1F6D2;', label: 'Customer' },
                { value: 'restaurant', icon: '&#x1F374;', label: 'Restaurant' },
                { value: 'operator',   icon: '&#x1F681;', label: 'Operator' },
              ].map((r) => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`p-3 rounded-xl border text-center transition-all ${role === r.value ? 'border-brand-500 bg-brand-500/10' : 'border-dark-300 hover:border-dark-200'}`}>
                  <div className="text-xl mb-1" dangerouslySetInnerHTML={{ __html: r.icon }} />
                  <div className="text-white text-xs font-medium">{r.label}</div>
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary w-full mt-2 text-base py-3.5" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Yuklanmoqda...' : "Ro'yxatdan o'tish"}
          </button>

          <p className="text-center text-sm text-gray-500 pt-1">
            Hisobingiz bormi?{' '}
            <a href="/login" className="text-brand-400 hover:text-brand-300 font-medium">Kirish</a>
          </p>
        </div>
      </div>
    </main>
  );
}

