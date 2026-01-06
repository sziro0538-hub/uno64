"use client";

import { useState, useEffect, useRef } from "react";
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

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${form.slug || 'banner'}-${Date.now()}.${fileExt}`;
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
      alert(`Помилка завантаження: ${error.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      e.target.value = '';
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        setForm({ ...form, image_url: imageUrl });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.slug.trim()) {
      alert('Slug обов\'язковий!');
      return;
    }

    try {
      if (!editingId) {
        const { data: existing, error: checkError } = await supabase
          .from("banners")
          .select("id")
          .eq("slug", form.slug)
          .maybeSingle();
        
        if (checkError) throw checkError;
        if (existing) {
          alert(`Slug "${form.slug}" вже існує!`);
          return;
        }
      }

      let result;
      if (editingId) {
        const { error } = await supabase
          .from("banners")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", editingId);
        if (error) throw error;
        alert("Банер оновлено");
      } else {
        result = await supabase
          .from("banners")
          .insert([form])
          .select()
          .single();
        if (!result.data) throw new Error("Не вдалося створити");
        alert("Банер створено");
      }

      loadBanners();
      resetForm();
    } catch (error: any) {
      alert(`Помилка: ${error.message}`);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (!error) {
        loadBanners();
        alert("Видалено");
      }
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Завантаження...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Керування банерами</h1>

      {/* Форма */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '20px', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
          {editingId ? "Редагувати" : "Створити"} банер
        </h2>
        <form onSubmit={handleSubmit}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '12px 12px 12px 0', width: '200px', verticalAlign: 'top' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Slug *</label>
                </td>
                <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                  <input
                    type="text"
                    placeholder="dashboard-main"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    style={{ width: '100%', maxWidth: '400px', padding: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    required
                  />
                </td>
              </tr>

              <tr>
                <td style={{ padding: '12px 12px 12px 0', verticalAlign: 'top' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Заголовок</label>
                </td>
                <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                  <input
                    type="text"
                    placeholder="Заголовок банера"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    style={{ width: '100%', maxWidth: '400px', padding: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </td>
              </tr>

              <tr>
                <td style={{ padding: '12px 12px 12px 0', verticalAlign: 'top' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Підзаголовок</label>
                </td>
                <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                  <textarea
                    placeholder="Опис банера..."
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    rows={3}
                    style={{ width: '100%', maxWidth: '400px', padding: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </td>
              </tr>

              <tr>
                <td style={{ padding: '12px 12px 12px 0', verticalAlign: 'top' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Зображення</label>
                </td>
                <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      style={{ flexGrow: 1, maxWidth: '400px' }}
                    />
                    {uploading && <span style={{ color: '#666' }}>Завантаження...</span>}
                  </div>
                  {form.image_url && (
                    <div style={{ marginTop: '10px' }}>
                      <img 
                        src={form.image_url} 
                        alt="Preview" 
                        style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid #ccc' }}
                      />
                    </div>
                  )}
                </td>
              </tr>

              <tr>
                <td style={{ padding: '12px 12px 12px 0', verticalAlign: 'top' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Розмір</label>
                </td>
                <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                  <select
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value as any })}
                    style={{ padding: '8px', border: '1px solid #ccc', width: '100%', maxWidth: '400px' }}
                  >
                    <option value="large">Великий</option>
                    <option value="small">Малий</option>
                  </select>
                </td>
              </tr>

              <tr>
                <td style={{ padding: '12px 12px 12px 0', verticalAlign: 'top' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Тип</label>
                </td>
                <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                  <select
                    value={form.variant}
                    onChange={(e) => setForm({ ...form, variant: e.target.value as any })}
                    style={{ padding: '8px', border: '1px solid #ccc', width: '100%', maxWidth: '400px' }}
                  >
                    <option value="single">Одиночний</option>
                    <option value="slider">Слайдер</option>
                  </select>
                </td>
              </tr>

              <tr>
                <td style={{ padding: '12px 12px 12px 0', verticalAlign: 'top' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Вирівнювання</label>
                </td>
                <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                  <select
                    value={form.align}
                    onChange={(e) => setForm({ ...form, align: e.target.value as any })}
                    style={{ padding: '8px', border: '1px solid #ccc', width: '100%', maxWidth: '400px' }}
                  >
                    <option value="center">По центру</option>
                    <option value="left">Вліво</option>
                    <option value="right">Вправо</option>
                  </select>
                </td>
              </tr>

              <tr>
                <td style={{ padding: '12px 12px 12px 0', verticalAlign: 'top' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Текст кнопки</label>
                </td>
                <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                  <input
                    type="text"
                    placeholder="Купити зараз"
                    value={form.button_label}
                    onChange={(e) => setForm({ ...form, button_label: e.target.value })}
                    style={{ width: '100%', maxWidth: '400px', padding: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </td>
              </tr>

              <tr>
                <td style={{ padding: '12px 12px 12px 0', verticalAlign: 'top' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Посилання кнопки</label>
                </td>
                <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={form.button_url}
                    onChange={(e) => setForm({ ...form, button_url: e.target.value })}
                    style={{ width: '100%', maxWidth: '400px', padding: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </td>
              </tr>

              <tr>
                <td style={{ padding: '12px 12px 12px 0', verticalAlign: 'top' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Статус</label>
                </td>
                <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  <label htmlFor="is_active">Активний</label>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={uploading || !form.slug.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                opacity: uploading || !form.slug.trim() ? 0.5 : 1
              }}
            >
              {editingId ? "Оновити" : "Створити"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#999',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Скасувати
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Таблиця банерів */}
      {banners.length > 0 ? (
        <div style={{ backgroundColor: '#fff', border: '1px solid #ccc' }}>
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderBottom: '1px solid #ccc', fontWeight: 'bold' }}>
            Ваші банери ({banners.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #ccc' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ccc' }}>Slug</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ccc' }}>Заголовок</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ccc' }}>Розмір</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ccc' }}>Тип</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #ccc' }}>Статус</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Дії</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', borderRight: '1px solid #eee', fontFamily: 'monospace' }}>{b.slug}</td>
                  <td style={{ padding: '12px', borderRight: '1px solid #eee' }}>{b.title || '-'}</td>
                  <td style={{ padding: '12px', borderRight: '1px solid #eee' }}>{b.size === 'large' ? 'Великий' : 'Малий'}</td>
                  <td style={{ padding: '12px', borderRight: '1px solid #eee' }}>{b.variant === 'slider' ? 'Слайдер' : 'Одиночний'}</td>
                  <td style={{ padding: '12px', textAlign: 'center', borderRight: '1px solid #eee' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: b.is_active ? '#e6ffe6' : '#ffe6e6',
                      color: b.is_active ? '#009900' : '#cc0000',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {b.is_active ? 'Активний' : 'Неактивний'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleEdit(b)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#0066cc',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        marginRight: '5px',
                        fontSize: '12px'
                      }}
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#cc0000',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Видалити
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '40px', textAlign: 'center', color: '#999' }}>
          Банерів не знайдено
        </div>
      )}
    </div>
  );
}
