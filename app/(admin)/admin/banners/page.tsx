"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Banner = {
  id: string;
  slug: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  images: string[] | null;
  size: "small" | "large";
  variant: "single" | "slider";
  align: "center" | "left" | "right";
  button_label: string | null;
  button_url: string | null;
  is_active: boolean;
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    slug: "",
    title: "",
    subtitle: "",
    image_url: "",
    images: [] as string[],
    size: "large" as "small" | "large",
    variant: "single" as "single" | "slider",
    align: "center" as "center" | "left" | "right",
    button_label: "",
    button_url: "",
    is_active: true,
  });

  const loadBanners = async () => {
    const { data } = await supabase
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    setBanners(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `banners/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      await supabase.storage.from("banners").upload(path, file);

      const { data } = supabase.storage
        .from("banners")
        .getPublicUrl(path);

      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);
    if (!url) return;

    if (form.variant === "slider") {
      if (form.images.length >= 5) {
        alert("Максимум 5 зображень");
        return;
      }
      setForm(f => ({ ...f, images: [...f.images, url] }));
    } else {
      setForm(f => ({ ...f, image_url: url }));
    }

    e.target.value = "";
  };

  const removeSliderImage = (i: number) => {
    setForm(f => ({
      ...f,
      images: f.images.filter((_, index) => index !== i),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.slug.trim()) {
      alert("Slug обовʼязковий");
      return;
    }

    const payload = {
      slug: form.slug,
      title: form.title || null,
      subtitle: form.subtitle || null,
      image_url: form.variant === "single" ? form.image_url : null,
      images: form.variant === "slider" ? form.images : null,
      size: form.size,
      variant: form.variant,
      align: form.align,
      button_label: form.button_label || null,
      button_url: form.button_url || null,
      is_active: form.is_active,
    };

    if (editingId) {
      await supabase.from("banners").update(payload).eq("id", editingId);
    } else {
      await supabase.from("banners").insert([payload]);
    }

    resetForm();
    loadBanners();
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      slug: "",
      title: "",
      subtitle: "",
      image_url: "",
      images: [],
      size: "large",
      variant: "single",
      align: "center",
      button_label: "",
      button_url: "",
      is_active: true,
    });
  };

  const editBanner = (b: Banner) => {
    setEditingId(b.id);
    setForm({
      slug: b.slug,
      title: b.title || "",
      subtitle: b.subtitle || "",
      image_url: b.image_url || "",
      images: b.images || [],
      size: b.size,
      variant: b.variant,
      align: b.align,
      button_label: b.button_label || "",
      button_url: b.button_url || "",
      is_active: b.is_active,
    });
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Видалити банер?")) return;
    await supabase.from("banners").delete().eq("id", id);
    loadBanners();
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Завантаження…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Керування банерами</h1>

      {/* FORM */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-100">
          {editingId ? "Редагування банера" : "Новий банер"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
              <input 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                placeholder="dashboard-main"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Тип</label>
              <select 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.variant}
                onChange={e =>
                  setForm({
                    ...form,
                    variant: e.target.value as any,
                    image_url: "",
                    images: [],
                  })
                }
              >
                <option value="single">Одиночний</option>
                <option value="slider">Слайдер</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Зображення 
              <span className="text-sm text-gray-500 ml-1">
                ({form.variant === "slider" ? `${form.images.length}/5` : "1"})
              </span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
              <input 
                type="file" 
                ref={fileRef} 
                onChange={handleFile}
                className="hidden"
                accept="image/*"
              />
              <button 
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                disabled={uploading}
              >
                {uploading ? "Завантаження..." : "Вибрати зображення"}
              </button>
            </div>
          </div>

          {form.image_url && form.variant === "single" && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-2">Попередній перегляд:</p>
              <img src={form.image_url} className="w-full max-w-sm rounded-lg border" />
            </div>
          )}

          {form.images.length > 0 && form.variant === "slider" && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-3">Слайдер ({form.images.length}/5):</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {form.images.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img src={img} className="w-24 h-16 object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => removeSliderImage(i)}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold border-2 border-white hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Заголовок</label>
              <input 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Заголовок банера"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Текст кнопки</label>
              <input 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Купити зараз"
                value={form.button_label}
                onChange={e => setForm({ ...form, button_label: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Підзаголовок</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[80px]"
              placeholder="Опис банера..."
              value={form.subtitle}
              onChange={e => setForm({ ...form, subtitle: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Посилання кнопки</label>
            <input 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com"
              value={form.button_url}
              onChange={e => setForm({ ...form, button_url: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 pb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Розмір</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                value={form.size}
                onChange={e => setForm({ ...form, size: e.target.value as any })}
              >
                <option value="large">Великий</option>
                <option value="small">Малий</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Вирівнювання</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                value={form.align}
                onChange={e => setForm({ ...form, align: e.target.value as any })}
              >
                <option value="center">По центру</option>
                <option value="left">Вліво</option>
                <option value="right">Вправо</option>
              </select>
            </div>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
              />
              <span className="text-sm font-medium text-gray-700">Активний</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
            <button 
              type="submit"
              disabled={!form.slug.trim() || uploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {editingId ? "Оновити" : "Створити"}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Скасувати
              </button>
            )}
          </div>
        </form>
      </div>

      {/* LIST */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Банери ({banners.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Тип</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Розмір</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {banners.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{b.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      b.variant === 'slider' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {b.variant}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                      {b.size}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      b.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {b.is_active ? 'Активний' : 'Неактивний'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => editBanner(b)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Редагувати
                    </button>
                    <button 
                      onClick={() => deleteBanner(b.id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    >
                      Видалити
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {banners.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-1">Банерів немає</h4>
            <p className="text-gray-500">Створіть перший банер</p>
          </div>
        )}
      </div>
    </div>
  );
}
