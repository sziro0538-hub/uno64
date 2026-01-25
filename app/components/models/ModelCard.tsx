// app/components/ModelCard.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Model = {
  id: string;
  title: string;
  year?: number;
  type: string;
  rarity?: string;
  imageurl?: string;
  likes?: number;
  dislikes?: number;
  description?: string;
};

interface ModelCardProps {
  model: Model;
  onClick?: () => void;
}

export default function ModelCard({ model, onClick }: ModelCardProps) {
  const [loading, setLoading] = useState(false);

  const addToCollection = async (category: 'collection' | 'want' | 'have' | 'wantexchange' | 'haveexchange') => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) {
        alert('Авторизуйтеся!');
        return;
      }

      const { error } = await supabase
        .from('usercollections')
        .insert({
          userid: user.user.id,
          modelid: model.id,
          category,
        });

      if (error?.code === '23505') {
        alert(`✅ ${category} вже в колекції!`);
      } else if (error) {
        alert(`❌ Помилка: ${error.message}`);
      } else {
        alert(`✅ Додано до "${category}"`);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleRating = async (rating: 1 | -1) => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) {
        alert('Авторизуйтеся!');
        return;
      }

      await supabase
        .from('modelratings')
        .delete()
        .eq('userid', user.user.id)
        .eq('modelid', model.id);

      const { error } = await supabase
        .from('modelratings')
        .insert({
          userid: user.user.id,
          modelid: model.id,
          rating,
        });

      if (!error) {
        alert(rating === 1 ? '👍 Лайк!' : '👎 Дізлайк!');
      }
    } finally {
      setLoading(false);
    }
  };

  const imgSrc = model.imageurl
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${model.imageurl}`
    : 'https://via.placeholder.com/300x400?text=No+Image';

  return (
    <article
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border hover:border-orange-200 cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute bottom-3 left-3 right-3 flex gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 bg-black/20 backdrop-blur-sm rounded-xl p-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCollection('have');
          }}
          disabled={loading}
          title="Маю"
          className="flex-1 py-2 px-3 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-sm transition-all pointer-events-auto disabled:opacity-50"
        >
          ✓ Маю
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCollection('want');
          }}
          disabled={loading}
          title="Хочу"
          className="flex-1 py-2 px-3 text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-sm transition-all pointer-events-auto disabled:opacity-50"
        >
          ★ Хочу
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCollection('collection');
          }}
          disabled={loading}
          title="Колекція"
          className="flex-1 py-2 px-3 text-xs font-semibold bg-slate-500 hover:bg-slate-600 text-white rounded-xl shadow-sm transition-all pointer-events-auto disabled:opacity-50"
        >
          📦 Кол.
        </button>
      </div>

      <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-gray-50 group-hover:scale-102 transition-all duration-300 mb-3">
        <img
  src={imgSrc}
  alt={model.title}
  className="w-full h-full object-contain p-3"
/>
        {model.likes && model.likes > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-bold">
            👍 {model.likes}
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
          {model.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          {model.year && <span className="bg-gray-100 px-2 py-1 rounded-full">{model.year}</span>}
          <span className="capitalize bg-blue-50 px-2 py-1 rounded-full">{model.type}</span>
        </div>

        {model.rarity && (
          <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
            {model.rarity}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleRating(1);
            }}
            disabled={loading}
            className="flex-1 py-1.5 px-2 text-xs font-semibold bg-green-100 hover:bg-green-200 text-green-800 rounded transition-all disabled:opacity-50"
          >
            👍 Лайк
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleRating(-1);
            }}
            disabled={loading}
            className="flex-1 py-1.5 px-2 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-800 rounded transition-all disabled:opacity-50"
          >
            👎 Дізл.
          </button>
        </div>
      </div>
    </article>
  );
}
