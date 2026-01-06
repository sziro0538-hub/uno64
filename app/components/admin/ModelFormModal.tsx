"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Model {
  id: string;
  title: string;
  year: number;
  rarity: string | null;
  type: string;
  image_url: string;
}

interface Props {
  model: Model | null;
  onClose: () => void;
  onSave: () => void;
}

// значення в БД + красиві лейбли
const TYPE_OPTIONS = [
  { value: "basic", label: "Basic" },
  { value: "premium", label: "Premium" },
  { value: "silver_serie", label: "Silver serie" },
  { value: "rlc", label: "RLC" },
  { value: "elite64", label: "Elite64" },
  { value: "mystery", label: "Mystery" },
  { value: "special", label: "Special" },
  { value: "ttransport", label: "TTransport" },
  { value: "packs", label: "Packs" },
  { value: "diorama", label: "Diorama" },
  { value: "custom", label: "Custom" },
];


const RARITY_OPTIONS = [
  { value: "TH", label: "TH" },
  { value: "STH", label: "STH" },
  { value: "chase", label: "Chase" },
];

const YEAR_OPTIONS = [2024, 2025, 2026];

export default function ModelFormModal({ model, onClose, onSave }: Props) {
  const [formData, setFormData] = useState({
    title: model?.title || "",
    year: model?.year || new Date().getFullYear(),
    rarity: model?.rarity || "",
    type: model?.type || "basicos",
    image_url: model?.image_url || "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let image_url = formData.image_url;

      // якщо обрано новий файл — завантажуємо в Supabase Storage
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
const filePath = fileName; // без "models/"

        const { error: uploadError } = await supabase.storage
          .from("models") // назва бакету в Supabase Storage
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        image_url = filePath;
      }

      const payload = {
        ...formData,
        image_url,
      };

      if (model) {
        const { error } = await supabase
          .from("models")
          .update(payload)
          .eq("id", model.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("models").insert([payload]);
        if (error) throw error;
      }

      onSave();
    } catch (error) {
      alert("Помилка при збереженні");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {model ? "Редагувати модель" : "Нова модель"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Назва */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Назва
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"
            />
          </div>

          {/* Рік */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Рік
            </label>
            <select
              value={formData.year}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  year: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"
            >
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Рідкість */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Рідкість
            </label>
            <select
              value={formData.rarity}
              onChange={(e) =>
                setFormData({ ...formData, rarity: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"
            >
              <option value="">Без рарності</option>
              {RARITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Тип */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Зображення */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Зображення
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                setFile(selected);
              }}
              className="w-full text-sm text-gray-700
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-semibold
                         file:bg-orange-50 file:text-orange-600
                         hover:file:bg-orange-100"
            />
            {formData.image_url && (
              <p className="mt-1 text-xs text-gray-500">
                Поточний файл: {formData.image_url}
              </p>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition disabled:opacity-50"
            >
              {loading ? "Збереження..." : "Зберегти"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
