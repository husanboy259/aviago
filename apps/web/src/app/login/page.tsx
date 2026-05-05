'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!email.includes('@')) { toast.error('Email kiriting'); return; }
    if (!password)            { toast.error('Parol kiriting'); return; }

    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Xush kelibsiz, ' + data.user.firstName + '!');
      const paths: Record<string, string> = {
        admin: '/admin', restaurant: '/restaurant',
        operator: '/operator', customer: '/restaurants',
      };
      router.push(paths[data.user.role] || '/restaurants');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Email yoki parol noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="card w-full max-w-md">

        <div className="text-center mb-8">
          <div className="text-4xl mb-3">&#x1F681;</div>
          <h1 className="text-2xl font-bold text-white">
            <span className="text-brand-500">Airo Go</span> ga kirish
          </h1>
          <p className="text-gray-400 text-sm mt-1">Email va parolingizni kiriting</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
            <input
              type="email"
              className="input"
              placeholder="siz@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Parol</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="input pr-11"
                placeholder="Parolingiz"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            className="btn-primary w-full text-base py-3.5"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Yuklanmoqda...' : 'Kirish'}
          </button>

          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-dark-300" />
            <span className="text-xs text-gray-600">yoki</span>
            <div className="flex-1 h-px bg-dark-300" />
          </div>

          <a href="/signup"
            className="btn-secondary w-full text-base py-3.5 text-center block">
            Yangi hisob yaratish
          </a>

          <p className="text-center text-xs text-gray-600 pt-1">
            <a href="/" className="hover:text-gray-400 transition-colors">← Bosh sahifaga qaytish</a>
          </p>
        </div>
      </div>
    </main>
  );
}

