"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Model = {
  id: string;
  name: string;
  series: string;  // ✅ Твоя колонка series замість brand
  year: number;
  rarity: string;
  image_url: string | null;
};

type SearchResult = {
  items: Model[];
  total: number;
  page: number;
  totalPages: number;
};

export default function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ items: [], total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(false);

  // Завантажуємо ONLY якщо є q в URL
  useEffect(() => {
    const q = params.get("q") || "";
    const page = parseInt(params.get("page") || "1");
    
    if (q.trim()) {
      setQuery(q);
      loadResults(q, page);
    }
  }, [params]);

  const loadResults = async (q: string, page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${page}`);
      const data: SearchResult = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Пошук по Enter
  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}&page=1`);
      }
    }
  }, [query, router]);

  const goToPage = (page: number) => {
    router.push(`/search?q=${encodeURIComponent(query)}&page=${page}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar з пошуком */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xl font-bold text-gray-800 hover:text-orange-500 transition-colors flex items-center gap-2"
          >
            ← Dashboard
          </button>
          <input
            type="text"
            placeholder="Buscar modelos, STH, CHASE... (Enter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="
              flex-1 max-w-md px-4 py-2 rounded-md bg-gray-100 text-gray-700 
              border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:outline-none
            "
          />
        </div>
      </nav>

      {/* Результати */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Resultados para: <span className="text-orange-500">"{query}"</span>
          </h1>
          <div className="text-sm text-gray-500">
            {results.total} modelos encontrados
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-lg text-gray-500">Buscando...</div>
          </div>
        ) : results.items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              No se encontraron modelos
            </h2>
            <p className="text-gray-500">Intenta con otra búsqueda</p>
          </div>
        ) : (
          <>
            {/* ✅ Сітка 4 в ряд */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
              {results.items.map((model: Model) => (
                <Link
                  key={model.id}
                  href={`/model/${model.id}`}
                  className="group bg-white border rounded-xl p-4 hover:shadow-xl transition-all overflow-hidden"
                >
                  {model.image_url ? (
                    <img
                      src={model.image_url}
                      alt={model.name}
                      className="w-full h-32 object-contain mb-3 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded-lg mb-3">
                      Sin imagen
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-orange-600">
                    {model.name}
                  </h3>
                  <p className="text-sm text-gray-500">{model.series}</p> {/* ✅ series */}
                  <span className="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                    {model.rarity}
                  </span>
                </Link>
              ))}
            </div>

            {/* Пагінація */}
            {results.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => goToPage(results.page - 1)}
                  disabled={results.page === 1}
                  className="px-4 py-2 text-sm font-medium rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Anterior
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: results.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                        p === results.page
                          ? "bg-orange-500 text-white shadow-md"
                          : "bg-white border hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => goToPage(results.page + 1)}
                  disabled={results.page === results.totalPages}
                  className="px-4 py-2 text-sm font-medium rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
