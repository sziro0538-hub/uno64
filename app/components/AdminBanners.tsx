"use client";

import { useState, useEffect, useRef, DragEvent } from "react";
import { supabase } from "@/lib/supabase";

type Banner = {
  id: string;
  slug: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  size: "small" | "large";
  variant: "single" | "slider";
  align: "center" | "left" | "right";
  button_label: string | null;
  button_url: string | null;
  is_active: boolean;
};

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    slug: "",
    title: "",
    subtitle: "",
    image_url: "",
    size: "large" as "small" | "large",
    variant: "single" as "single" | "slider",
    align: "center" as "center" | "left" | "right",
    button_label: "",
    button_url: "",
    is_active: true,
  });

  // Завантажити банери
  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    const { data } = await supabase
      .from("banners")
      .select("*")
      .order("order");
    setBanners(data || []);
    setLoading(false);
  };

  // Завантаження зображення в Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${form.slug}-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { data, error } = await supabase.storage
        .from('banners')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Drag & Drop handlers
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const imageUrl = await uploadImage(e.dataTransfer.files[0]);
      if (imageUrl) {
        setForm({ ...form, image_url: imageUrl });
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        setForm({ ...form, image_url: imageUrl });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Перевіряємо slug унікальність
    if (!editingId) {
      const { data: existing } = await supabase
        .from("banners")
        .select("id")
        .eq("slug", form.slug)
        .single();
      
      if (existing) {
        alert("Slug вже існує!");
        return;
      }
    }

    if (editingId) {
      // Оновити
      const { error } = await supabase
        .from("banners")
        .update(form)
        .eq("id", editingId);
      if (!error) {
        loadBanners();
        resetForm();
      }
    } else {
      // Створити
      const { data, error } = await supabase
        .from("banners")
        .insert([form])
        .select()
        .single();
      if (!error) loadBanners();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      slug: "",
      title: "",
      subtitle: "",
      image_url: "",
      size: "large",
      variant: "single",
      align: "center",
      button_label: "",
      button_url: "",
      is_active: true,
    });
  };

  const handleEdit = (banner: Banner) => {
    setForm({
      slug: banner.slug,
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      image_url: banner.image_url || "",
      size: banner.size,
      variant: banner.variant,
      align: banner.align,
      button_label: banner.button_label || "",
      button_url: banner.button_url || "",
      is_active: banner.is_active,
    });
    setEditingId(banner.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Видалити банер?")) {
      await supabase.from("banners").delete().eq("id", id);
      loadBanners();
    }
  };

  if (loading) return <div className="p-8">Завантаження...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Керування банерами</h1>

      {/* Форма */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-6">
          {editingId ? "Редагувати" : "Створити"} банер
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input
            placeholder="Slug (dashboard-main)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          />
          
          <input
            placeholder="Заголовок"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
          />
          
          <textarea
            placeholder="Підзаголовок"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            rows={3}
            className="p-3 border rounded-lg md:col-span-2 focus:ring-2 focus:ring-orange-500"
          />

          {/* Drag & Drop зона для зображення */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Зображення банера</label>
            <div
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center
                transition-all duration-200 cursor-pointer hover:border-orange-400
                ${dragActive 
                  ? 'border-orange-500 bg-orange-50 shadow-lg scale-105' 
                  : form.image_url 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }
                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="text-sm text-gray-600">Завантаження...</p>
                </div>
              ) : form.image_url ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-green-700">Зображення завантажено</p>
                  <img 
                    src={form.image_url} 
                    alt="Preview" 
                    className="w-24 h-24 object-cover rounded-lg mt-2"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Перетягніть зображення сюди</p>
                    <p className="text-sm text-gray-500">або клацніть для вибору</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Розмір</label>
            <select
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value as any })}
              className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-orange-500"
            >
              <option value="large">Великий</option>
              <option value="small">Малий</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Тип</label>
            <select
              value={form.variant}
              onChange={(e) => setForm({ ...form, variant: e.target.value as any })}
              className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-orange-500"
            >
              <option value="single">Одиночний</option>
              <option value="slider">Слайдер</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Вирівнювання</label>
            <select
              value={form.align}
              onChange={(e) => setForm({ ...form, align: e.target.value as any })}
              className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-orange-500"
            >
              <option value="center">По центру</option>
              <option value="left">Вліво</option>
              <option value="right">Вправо</option>
            </select>
          </div>

          <input
            placeholder="Текст кнопки"
            value={form.button_label}
            onChange={(e) => setForm({ ...form, button_label: e.target.value })}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
          />
          
          <input
            placeholder="Посилання кнопки"
            value={form.button_url}
            onChange={(e) => setForm({ ...form, button_url: e.target.value })}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
          />
          
          <label className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 text-orange-500 rounded"
            />
            Активний
          </label>
          
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50"
            >
              {editingId ? "Оновити" : "Створити"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                Скасувати
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Список банерів */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-4 text-left font-semibold">Slug</th>
              <th className="p-4 text-left font-semibold">Заголовок</th>
              <th className="p-4 text-left font-semibold">Розмір</th>
              <th className="p-4 text-left font-semibold">Тип</th>
              <th className="p-4 text-center font-semibold">Статус</th>
              <th className="p-4 text-right font-semibold">Дії</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-mono font-semibold">{b.slug}</td>
                <td className="p-4 max-w-xs truncate">{b.title}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    b.size === 'large' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {b.size}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    b.variant === 'slider' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {b.variant}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    b.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {b.is_active ? 'Активний' : 'Неактивний'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleEdit(b)}
                    className="mr-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
                  >
                    Редагувати
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Видалити
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
