"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PageFormModal from "@/app/components/admin/PageFormModal";

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  created_at: string;
}

export default function PagesAdminPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading pages:", error);
    } else {
      setPages(data || []);
    }
    setLoading(false);
  }

  async function togglePublish(id: string, current: boolean) {
    const { error } = await supabase
      .from("pages")
      .update({ published: !current })
      .eq("id", id);

    if (error) {
      alert("Помилка при оновленні");
    } else {
      setPages(
        pages.map((p) => (p.id === id ? { ...p, published: !current } : p))
      );
    }
  }

  async function deletePage(id: string) {
    if (!confirm("Ви впевнені, що хочете видалити цю сторінку?")) return;

    const { error } = await supabase.from("pages").delete().eq("id", id);

    if (error) {
      alert("Помилка при видаленні");
    } else {
      setPages(pages.filter((p) => p.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Управління сторінками</h1>
        <button
          onClick={() => {
            setEditingPage(null);
            setShowModal(true);
          }}
          className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
        >
          + Нова сторінка
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Назва
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Статус
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                Дії
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Завантаження...
                </td>
              </tr>
            ) : pages.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Немає сторінок
                </td>
              </tr>
            ) : (
              pages.map((page) => (
                <tr key={page.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 font-medium">{page.title}</td>
                  <td className="px-6 py-4 text-gray-600">/{page.slug}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        page.published
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {page.published ? "Опубліковано" : "Чернетка"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() =>
                        togglePublish(page.id, page.published)
                      }
                      className="text-green-600 hover:text-green-800 font-medium text-sm"
                    >
                      {page.published ? "Приховати" : "Показати"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingPage(page);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={() => deletePage(page.id)}
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

      {showModal && (
        <PageFormModal
          page={editingPage}
          onClose={() => {
            setShowModal(false);
            setEditingPage(null);
          }}
          onSave={() => {
            loadPages();
            setShowModal(false);
            setEditingPage(null);
          }}
        />
      )}
    </div>
  );
}
