'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantApi, menuApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  'Asosiy taomlar', 'Salatlar', 'Sho\'rvalar', 'Ichimliklar',
  'Desert', 'Snacks', 'Pizza', 'Burger', 'Sushi', 'Boshqa',
];

function fmt(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + ' UZS';
}

export default function AdminProductsPage() {
  const qc = useQueryClient();

  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const [form, setForm] = useState({
    name: '', description: '', price: '', category: CATEGORIES[0],
    preparationMinutes: '15', isAvailable: true, imageUrl: '',
  });

  // Load all restaurants (admin endpoint, no status filter)
  const { data: restaurants = [] } = useQuery({
    queryKey: ['admin-restaurants-list'],
    queryFn: () => restaurantApi.adminList().then(r => r.data || []),
  });

  // Load menu for selected restaurant
  const { data: menuGroups = {}, isLoading: menuLoading } = useQuery({
    queryKey: ['admin-menu', selectedRestaurant],
    queryFn: () => menuApi.list(selectedRestaurant).then(r => r.data),
    enabled: !!selectedRestaurant,
  });

  const allItems = Object.values(menuGroups as Record<string, any[]>).flat();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: () => menuApi.create(selectedRestaurant, {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      preparationMinutes: Number(form.preparationMinutes),
      isAvailable: form.isAvailable,
      imageUrl: form.imageUrl || undefined,
    }),
    onSuccess: () => {
      toast.success('Mahsulot qo\'shildi!');
      qc.invalidateQueries({ queryKey: ['admin-menu', selectedRestaurant] });
      resetForm();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (id: string) => menuApi.update(selectedRestaurant, id, {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      preparationMinutes: Number(form.preparationMinutes),
      isAvailable: form.isAvailable,
      imageUrl: form.imageUrl || undefined,
    }),
    onSuccess: () => {
      toast.success('Yangilandi!');
      qc.invalidateQueries({ queryKey: ['admin-menu', selectedRestaurant] });
      resetForm();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xato'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuApi.remove(selectedRestaurant, id),
    onSuccess: () => {
      toast.success('O\'chirildi');
      qc.invalidateQueries({ queryKey: ['admin-menu', selectedRestaurant] });
    },
    onError: () => toast.error('O\'chirib bo\'lmadi'),
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => menuApi.toggle(selectedRestaurant, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-menu', selectedRestaurant] }),
  });

  function resetForm() {
    setForm({ name: '', description: '', price: '', category: CATEGORIES[0], preparationMinutes: '15', isAvailable: true, imageUrl: '' });
    setShowForm(false);
    setEditItem(null);
  }

  function startEdit(item: any) {
    setForm({
      name: item.name, description: item.description || '',
      price: String(item.price), category: item.category,
      preparationMinutes: String(item.preparationMinutes),
      isAvailable: item.isAvailable, imageUrl: item.imageUrl || '',
    });
    setEditItem(item);
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.name.trim())  { toast.error('Nomi kiriting'); return; }
    if (!form.price || isNaN(Number(form.price))) { toast.error('Narx kiriting'); return; }
    if (editItem) updateMutation.mutate(editItem.id);
    else createMutation.mutate();
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="bg-dark-100 border-b border-dark-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm">← Admin</Link>
          <span className="text-gray-600">/</span>
          <h1 className="font-bold text-white">Mahsulotlar</h1>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditItem(null); }}
          disabled={!selectedRestaurant}
          className="btn-primary flex items-center gap-2 text-sm py-2 disabled:opacity-40"
        >
          <Plus className="w-4 h-4" /> Yangi mahsulot
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left — Restaurant selector */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="font-semibold text-white mb-3 text-sm">Restoran tanlang</h2>
            <div className="space-y-1">
              {(restaurants as any[]).map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRestaurant(r.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                    selectedRestaurant === r.id
                      ? 'bg-brand-500/10 border border-brand-500/30 text-brand-400'
                      : 'text-gray-400 hover:bg-dark-200 hover:text-white'
                  }`}
                >
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs opacity-60 mt-0.5">{r.totalOrders} orders</p>
                </button>
              ))}
              {(restaurants as any[]).length === 0 && (
                <p className="text-gray-500 text-xs text-center py-4">Restoran yo'q</p>
              )}
            </div>
          </div>
        </div>

        {/* Right — Menu items */}
        <div className="lg:col-span-3">

          {/* Add/Edit form */}
          {showForm && (
            <div className="card mb-6 border-brand-500/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">
                  {editItem ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}
                </h2>
                <button onClick={resetForm} className="text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Nomi *</label>
                  <input className="input" placeholder="Masalan: Osh palov" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Narxi (UZS) *</label>
                  <input className="input" type="number" placeholder="35000" value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-400 mb-1.5 block">Tavsif</label>
                  <textarea className="input resize-none" rows={2} placeholder="Mahsulot haqida qisqacha..."
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Kategoriya</label>
                  <select className="input" value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Tayyorlanish vaqti (daqiqa)</label>
                  <input className="input" type="number" value={form.preparationMinutes}
                    onChange={e => setForm({ ...form, preparationMinutes: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-400 mb-1.5 block">Rasm URL (ixtiyoriy)</label>
                  <input className="input" placeholder="https://..." value={form.imageUrl}
                    onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <button type="button" onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}>
                    {form.isAvailable
                      ? <ToggleRight className="w-8 h-8 text-brand-500" />
                      : <ToggleLeft  className="w-8 h-8 text-gray-500" />}
                  </button>
                  <span className="text-sm text-gray-300">
                    {form.isAvailable ? 'Mavjud' : 'Mavjud emas'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={resetForm} className="btn-secondary flex-1">Bekor</button>
                <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  {saving ? 'Saqlanmoqda...' : editItem ? 'Yangilash' : 'Qo\'shish'}
                </button>
              </div>
            </div>
          )}

          {!selectedRestaurant ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="text-gray-400">Chap tarafdan restoran tanlang</p>
            </div>
          ) : menuLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-dark-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : allItems.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-400 mb-4">Hali mahsulot yo'q</p>
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
                + Birinchi mahsulot qo'shish
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="card text-center py-3">
                  <p className="text-2xl font-bold text-white">{allItems.length}</p>
                  <p className="text-xs text-gray-500">Jami</p>
                </div>
                <div className="card text-center py-3">
                  <p className="text-2xl font-bold text-brand-400">
                    {allItems.filter((i: any) => i.isAvailable).length}
                  </p>
                  <p className="text-xs text-gray-500">Mavjud</p>
                </div>
                <div className="card text-center py-3">
                  <p className="text-2xl font-bold text-gray-500">
                    {allItems.filter((i: any) => !i.isAvailable).length}
                  </p>
                  <p className="text-xs text-gray-500">Mavjud emas</p>
                </div>
              </div>

              {/* Items list */}
              {allItems.map((item: any) => (
                <div key={item.id} className="card flex items-center gap-4">
                  {/* Image */}
                  <div className="w-14 h-14 rounded-xl bg-dark-200 flex-shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🍴</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white text-sm truncate">{item.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        item.isAvailable ? 'bg-brand-500/10 text-brand-400' : 'bg-gray-500/10 text-gray-500'
                      }`}>
                        {item.isAvailable ? 'Mavjud' : 'Yoq'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{item.category} · {item.preparationMinutes} min</p>
                    <p className="text-brand-400 font-semibold text-sm mt-0.5">{fmt(item.price)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate(item.id)}
                      className="p-2 rounded-lg hover:bg-dark-200 transition-colors text-gray-400 hover:text-brand-400"
                      title={item.isAvailable ? 'O\'chirish' : 'Yoqish'}
                    >
                      {item.isAvailable
                        ? <ToggleRight className="w-4 h-4 text-brand-400" />
                        : <ToggleLeft  className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="p-2 rounded-lg hover:bg-dark-200 transition-colors text-gray-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${item.name}" ni o'chirasizmi?`)) deleteMutation.mutate(item.id);
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
