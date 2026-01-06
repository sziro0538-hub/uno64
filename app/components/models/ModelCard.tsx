"use client";

import Image from "next/image";

export default function ModelCard({ model, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="
        cursor-pointer
        p-3 
        rounded-xl 
        bg-white 
        shadow-sm 
        hover:shadow-lg 
        transition 
        duration-300
      "
    >
      {/* Фото моделі */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-100">
        <Image
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${model.image_url}`}
          alt={model.title}
          fill
          className="object-contain"
        />

        {/* ❤️ Лайки */}
        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-red-500 text-sm font-semibold shadow">
          ❤️ {model.likes ?? 0}
        </div>
      </div>

      {/* Назва */}
      <h3 className="mt-3 font-semibold text-gray-800 text-[15px] leading-tight">
        {model.title}
      </h3>

      {/* Лайки / дизлайки / шер */}
      <div className="flex items-center gap-4 mt-2 text-gray-700 text-sm">
        {/* Лайк */}
        <div className="flex items-center gap-1">
          <span>📨</span>
          <span>{model.likes ?? 0}</span>
        </div>

        {/* Дизлайк */}
        <div className="flex items-center gap-1">
          <span>😒</span>
          <span>{model.dislikes ?? 0}</span>
        </div>
      </div>

      {/* Теги */}
      <div className="flex gap-2 mt-3">
        {/* Рік */}
        <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-md">
          {model.year}
        </span>

        {/* Тип */}
        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-md">
          {model.type}
        </span>
      </div>
    </div>
  );
}
