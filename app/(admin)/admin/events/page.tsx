"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string;
  date: string;
  link: string | null;
  image_url: string;
  button_label: string | null;  // Нова колонка
  maps_url: string | null;      // Нова колонка
  created_at: string;
}

const DEFAULT_IMAGE = "https://via.placeholder.com/400x300";
const DESCRIPTION_LIMIT = 240;

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    link: "",
    buttonLabel: "",
    mapsUrl: "",
    image: null as File | null,
    currentImageUrl: "" as string | null,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    document.body.style.overflow = showForm ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showForm]);

  async function fetchEvents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setEvents(data || []);

    setLoading(false);
  }

  async function uploadEventImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop();
    const path = `events/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("event-images")
      .upload(path, file);

    if (error) throw new Error(error.message);

    return supabase.storage
      .from("event-images")
      .getPublicUrl(path).data.publicUrl;
  }

  function openCreateForm() {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      location: "",
      date: "",
      link: "",
      buttonLabel: "",
      mapsUrl: "",
      image: null,
      currentImageUrl: null,
    });
    setShowForm(true);
  }

  function openEditForm(event: Event) {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      location: event.location,
      date: event.date.slice(0, 10),
      link: event.link || "",
      buttonLabel: event.button_label || "",
      mapsUrl: event.maps_url || "",
      image: null,
      currentImageUrl: event.image_url,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let imageUrl = formData.currentImageUrl || DEFAULT_IMAGE;

      // якщо вибрали новий файл – завантажуємо
      if (formData.image) {
        imageUrl = await uploadEventImage(formData.image);
      }

      // опис обрізаємо до 120 символів
      const trimmedDescription =
        formData.description.length > DESCRIPTION_LIMIT
          ? formData.description.slice(0, DESCRIPTION_LIMIT)
          : formData.description;

      const payload = {
        title: formData.title,
        description: trimmedDescription || null,
        location: formData.location,
        date: formData.date,
        link: formData.link || null,
        image_url: imageUrl,
        button_label: formData.buttonLabel || null,
        maps_url: formData.mapsUrl || null,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from("events")
          .update(payload)
          .eq("id", editingEvent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingEvent(null);
      setFormData({
        title: "",
        description: "",
        location: "",
        date: "",
        link: "",
        buttonLabel: "",
        mapsUrl: "",
        image: null,
        currentImageUrl: null,
      });

      fetchEvents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm("Видалити подію?")) return;
    await supabase.from("events").delete().eq("id", id);
    fetchEvents();
  }

  /* IMAGE HANDLERS */

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setFormData((prev) => ({ ...prev, image: file }));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function closeForm() {
    if (submitting) return;
    setShowForm(false);
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      location: "",
      date: "",
      link: "",
      buttonLabel: "",
      mapsUrl: "",
      image: null,
      currentImageUrl: null,
    });
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Адмінка подій</h1>
        <button
          onClick={openCreateForm}
          className="px-5 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
        >
          + Нова подія
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Назва</th>
              <th className="px-6 py-3 text-left">Дата</th>
              <th className="px-6 py-3 text-left">Місце</th>
              <th className="px-6 py-3 text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  Завантаження...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  Немає подій
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{event.title}</td>
                  <td className="px-6 py-4">
                    {new Date(event.date).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-6 py-4">{event.location}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => openEditForm(event)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Видалити
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={closeForm}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
          >
            <h2 className="text-xl font-semibold mb-6">
              {editingEvent ? "Редагувати подію" : "Нова подія"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                placeholder="Назва події"
                className="w-full border rounded-lg px-3 py-2"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />

              <div>
                <label className="block text-sm mb-1">
                  Опис (макс. {DESCRIPTION_LIMIT} символів)
                </label>
                <textarea
                  placeholder="Опис"
                  rows={3}
                  maxLength={DESCRIPTION_LIMIT}
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/{DESCRIPTION_LIMIT}
                </p>
              </div>

              <input
                required
                placeholder="Локація"
                className="w-full border rounded-lg px-3 py-2"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />

              <input
                required
                type="date"
                className="w-full border rounded-lg px-3 py-2"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />

              <input
                placeholder="Посилання (наприклад, на сайт події)"
                type="url"
                className="w-full border rounded-lg px-3 py-2"
                value={formData.link}
                onChange={(e) =>
                  setFormData({ ...formData, link: e.target.value })
                }
              />

              <input
                placeholder="Назва кнопки (наприклад, 'Купити квиток')"
                className="w-full border rounded-lg px-3 py-2"
                value={formData.buttonLabel}
                onChange={(e) =>
                  setFormData({ ...formData, buttonLabel: e.target.value })
                }
              />

              <input
                placeholder="Посилання на Google Maps"
                type="url"
                className="w-full border rounded-lg px-3 py-2"
                value={formData.mapsUrl}
                onChange={(e) =>
                  setFormData({ ...formData, mapsUrl: e.target.value })
                }
              />

              {/* IMAGE UPLOAD */}
              <div
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition"
              >
                {formData.image ? (
                  <img
                    src={URL.createObjectURL(formData.image)}
                    alt="preview"
                    className="rounded-lg max-h-40 mx-auto"
                  />
                ) : formData.currentImageUrl ? (
                  <img
                    src={formData.currentImageUrl}
                    alt="current"
                    className="rounded-lg max-h-40 mx-auto"
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    <span className="text-orange-600 font-medium">
                      Додати зображення
                    </span>{" "}
                    або перетягни сюди
                  </p>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    e.target.files && handleFile(e.target.files[0])
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  disabled={submitting}
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {submitting
                    ? "Збереження..."
                    : editingEvent
                    ? "Зберегти зміни"
                    : "Створити"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 text-gray-600 hover:text-black"
                >
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
