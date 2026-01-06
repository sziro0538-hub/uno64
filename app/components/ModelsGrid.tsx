"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Model = {
  id: string;
  title: string;
  year: number;
  rarity: string | null;
  type: string;
  image_url: string | null;
};

type ModelType =
  | "basicos"
  | "premium"
  | "elite64"
  | "rlc"
  | "custom"
  | "silver_serie"
  | "mystery"
  | "special"
  | "ttransport"
  | "packs"
  | "diorama";

interface ModelsGridProps {
  type: ModelType;
  title: string;
  maxRows?: number;
}

export default function ModelsGrid({ type, title, maxRows = 3 }: ModelsGridProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  const columnsDesktop = 4;
  const limit = maxRows * columnsDesktop;

  const BUCKET_URL =
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  useEffect(() => {
    async function loadModels() {
      setLoading(true);

      const { data, error } = await supabase
        .from("models")
        .select("id, title, year, rarity, type, image_url")
        .eq("type", type)              // ← ВАЖЛИВО: тут використовується проп `type`
        .order("year", { ascending: false })
        .limit(limit);

      if (!error && data) {
        setModels(data as Model[]);
      } else {
        console.error("Models load error", error);
      }

      setLoading(false);
    }

    loadModels();
  }, [type, limit]);

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    return `${BUCKET_URL}/models/${path}`;
  };

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      {loading && (
        <p className="text-sm text-gray-500 mb-2">Loading models...</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {models.map((model) => {
          const imgSrc = getImageUrl(model.image_url);

          return (
            <article
              key={model.id}
              className="bg-white rounded-3xl shadow-md overflow-hidden flex flex-col"
            >
              <div className="bg-gray-200 flex items-center justify-center">
                {imgSrc && (
                  <img
                    src={imgSrc}
                    alt={model.title}
                    className="w-full h-52 object-contain"
                  />
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between border-t border-gray-100">
                <div className="px-4 pt-3">
                  {model.rarity && (
                    <div className="flex justify-end mb-2">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-500 text-white">
                        {model.rarity}
                      </span>
                    </div>
                  )}

                  <h3 className="text-sm font-semibold text-gray-900 mb-3 line-clamp-2">
                    {model.title}
                  </h3>
                </div>

                <div className="px-4 pb-3 flex items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800">
                    {model.year}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-orange-500 text-white">
                    {model.type}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
