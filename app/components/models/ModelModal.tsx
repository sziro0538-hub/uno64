"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";

export default function ModelModal({ model, onClose }: any) {
  const router = useRouter();
  const params = useSearchParams();

  // Закриття по ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!model) return null;

  // Лінка для шерінгу
  const shareURL = `${window.location.origin}?id=${model.id}`;

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/60 backdrop-blur-sm
        animate-fadeIn
      "
      onClick={onClose}
    >
      <div
        className="
          bg-white rounded-xl shadow-xl p-5 relative max-w-md w-full
          animate-scaleIn
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Фото */}
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
          <Image
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${model.image_url}`}
            alt={model.title}
            fill
            className="object-contain"
          />
        </div>

        {/* Назва */}
        <h2 className="mt-4 text-xl font-semibold text-gray-800">
          {model.title}
        </h2>

        {/* Опис */}
        {model.description && (
          <p className="text-gray-600 text-sm mt-2">{model.description}</p>
        )}

        {/* Теги */}
        <div className="flex gap-2 mt-4">
          <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-md">
            {model.year}
          </span>

          <span className="px-2 py-1 bg-gray-300 text-gray-900 text-xs rounded-md">
            {model.type}
          </span>

          {model.rarity && (
            <span className="px-2 py-1 bg-yellow-300 text-black text-xs rounded-md">
              {model.rarity}
            </span>
          )}
        </div>

        {/* Лайки / дизлайки */}
        <div className="flex gap-6 mt-4 text-gray-800">
          <div className="flex gap-2 items-center">
            ❤️ <span>{model.likes ?? 0}</span>
          </div>

          <div className="flex gap-2 items-center">
            😒 <span>{model.dislikes ?? 0}</span>
          </div>
        </div>

        {/* Share */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(shareURL);
            alert("Link copied!");
          }}
          className="
            mt-5 w-full py-2 bg-orange-500 text-white 
            rounded-md hover:bg-orange-600 transition
          "
        >
          Share 🔗
        </button>

        {/* Закрити */}
        <button
          onClick={onClose}
          className="
            absolute -top-4 right-0 bg-white border shadow
            rounded-full h-8 w-8 flex items-center justify-center
          "
        >
          ✕
        </button>
      </div>
    </div>
  );
}
