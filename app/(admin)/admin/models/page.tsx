"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ModelFormModal from "@/app/components/admin/ModelFormModal";

interface Model {
  id: string;
  title: string;
  year: number;
  rarity: string;
  type: string;
  image_url: string;
  description?: string;
  created_at: string;
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [sortBy, setSortBy] = useState<"title" | "year">("title");

  useEffect(() => {
    loadModels();
  }, [sortBy]);

  async function loadModels() {
    setLoading(true);
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .order(sortBy, { ascending: true });

    if (error) {
      console.error("Error loading models:", error);
    } else {
      setModels(data || []);
    }
    setLoading(false);
  }

  async function deleteModel(model: Model) {
    if (
      !confirm(
        `Ви впевнені, що хочете видалити цю модель "${model.title}"?`
      )
    ) {
      return;
    }

    console.log("DELETE MODEL INPUT:", model);

    // 1) Видаляємо запис з таблиці
    const { error: dbError } = await supabase
      .from("models")
      .delete()
      .eq("id", model.id);

    if (dbError) {
      console.error("Delete error:", dbError);
      alert("Помилка при видаленні: " + dbError.message);
      return;
    }

    // 2) Перечитуємо список із БД, щоб UI точно оновився
    await loadModels();

    // 3) Пробуємо видалити файл зі Storage (не впливає на таблицю)
    if (model.image_url) {
      const { error: storageError } = await supabase.storage
        .from("models")
        .remove([model.image_url]);

      if (storageError) {
        console.warn("Не вдалося видалити файл з Storage:", storageError);
      }
    }
  }

  const filteredModels = models.filter((model) =>
    model.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Управління моделями
        </h1>
        <button
          onClick={() => {
            setEditingModel(null);
            setShowModal(true);
          }}
          className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
        >
          + Нова модель
        </button>
      </div>

      {/* Фільтри */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Пошук по назві..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"
        />

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as "title" | "year");
          }}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"
        >
          <option value="title">Сортувати по назві</option>
          <option value="year">Сортувати по року</option>
        </select>
      </div>

      {/* Таблиця */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Назва
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Рік
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Рідкість
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Тип
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                Дії
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  Завантаження...
                </td>
              </tr>
            ) : filteredModels.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  Немає моделей
                </td>
              </tr>
            ) : (
              filteredModels.map((model) => (
                <tr
                  key={model.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    {model.title}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {model.year || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      {model.rarity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 capitalize">
                    {model.type}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => {
                        setEditingModel(model);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={() => deleteModel(model)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
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

      {/* Модалка */}
      {showModal && (
        <ModelFormModal
          model={editingModel}
          onClose={() => {
            setShowModal(false);
            setEditingModel(null);
          }}
          onSave={() => {
            loadModels();
            setShowModal(false);
            setEditingModel(null);
          }}
        />
      )}
    </div>
  );
}
