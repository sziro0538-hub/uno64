'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import ModelCard, { Model } from './models/ModelCard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ModelsGridProps {
  type: string;
  title: string;
  maxRows?: number;
}

const BUCKET_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/models/`;

export default function ModelsGrid({ type, title, maxRows = 3 }: ModelsGridProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  const columnsDesktop = 4;
  const limit = maxRows * columnsDesktop;

  useEffect(() => {
    loadModels();
  }, [type, limit]);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('models')
        .select('id, title, year, type, rarity, image_url, likes, dislikes, description')  // ← image_url!
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (err) {
        setError(`Помилка завантаження: ${err.message}`);
        setModels([]);
      } else if (!data || data.length === 0) {
        setError(`Немає моделей типу "${type}"`);
        setModels([]);
      } else {
        setModels(data as Model[]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
          <div className="text-yellow-800 mb-4">⚠️ {error}</div>
          <button
            onClick={loadModels}
            className="px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition"
          >
            Спробувати ще раз
          </button>
        </div>
      </section>
    );
  }

  if (models.length === 0) {
    return (
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">📦 Немає моделей</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {models.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            onClick={() => setSelectedModel(model)}
          />
        ))}
      </div>

      {selectedModel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedModel(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-95vh overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b bg-gradient-to-r from-orange-50 to-yellow-50">
              <h3 className="text-2xl font-black text-gray-900">{selectedModel.title}</h3>
              <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600">
                <span className="px-3 py-1 bg-blue-100 rounded-full capitalize">
                  {selectedModel.type}
                </span>
                {selectedModel.year && (
                  <span className="px-3 py-1 bg-gray-100 rounded-full">{selectedModel.year}</span>
                )}
                {selectedModel.rarity && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
                    {selectedModel.rarity}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {selectedModel.image_url && (
                <img
                  src={`${BUCKET_URL}${selectedModel.image_url}`}
                  alt={selectedModel.title}
                  className="w-full max-h-80 object-contain mx-auto rounded-2xl bg-gray-50 shadow-lg mb-6"
                />
              )}

              {selectedModel.description && (
                <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                  {selectedModel.description}
                </p>
              )}

              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-800 rounded-xl">
                  👍 {selectedModel.likes || 0}
                </span>
                <span className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-800 rounded-xl">
                  👎 {selectedModel.dislikes || 0}
                </span>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setSelectedModel(null)}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
