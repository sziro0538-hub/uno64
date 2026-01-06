"use client";


import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";


type Profile = {
  id: string;
  nickname: string;
  bio: string;
  tiktok: string;
  url: string;
};


export default function ProfilePage() {
  const params = useParams();
  const profileId = params.id as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nickname, bio, tiktok, url")
        .eq("id", profileId)
        .single();


      if (error) {
        console.error("Profile not found:", error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };


    loadProfile();
  }, [profileId]);


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">Cargando perfil...</div>
      </div>
    );
  }


  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-500">Perfil no encontrado</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Шапка профілю */}
        <div className="bg-gray-200 px-5 py-6 rounded-bl-2xl flex items-center justify-between mb-8 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            {/* АVATAR З ПЕРЕВІРКОЮ */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
              {profile?.nickname?.charAt(0)?.toUpperCase() || '?'}
            </div>


            {/* Нікнейм + ID З ПЕРЕВІРКАМИ */}
            <div>
              <div className="text-lg font-semibold text-gray-700">{profile.nickname || "Sin nombre"}</div>
              <div className="text-xs text-gray-500">
                ID: {profile.id ? profile.id.slice(0, 8) + "..." : "----"}
              </div>
            </div>
          </div>
        </div>


        {/* Поля профілю */}
        <div className="space-y-6">
          {/* Опис */}
          <div className="bg-white p-4 rounded-md border border-gray-300 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-3 font-semibold">Descripción</label>
            <div className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-md border border-gray-200 min-h-[80px]">
              {profile.bio || "Sin descripción"}
            </div>
            <div className="text-xs text-gray-500 mt-2">Máx. 120 caracteres</div>
          </div>


          {/* TikTok */}
          {profile.tiktok && (
            <div className="bg-white p-4 rounded-md border border-gray-300 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3 font-semibold">TikTok</label>
              <a
                href={`https://tiktok.com/@${profile.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 text-sm bg-gray-50 p-3 rounded-md border border-gray-200 hover:bg-orange-50 hover:text-orange-600 transition-all block"
              >
                @{profile.tiktok}
              </a>
            </div>
          )}


          {/* URL */}
          {profile.url && (
            <div className="bg-white p-4 rounded-md border border-gray-300 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3 font-semibold">Enlace</label>
              <a
                href={profile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 text-sm bg-gray-50 p-3 rounded-md border border-gray-200 hover:bg-orange-50 hover:text-orange-600 transition-all break-all block"
              >
                {profile.url}
              </a>
            </div>
          )}
        </div>


        {/* Кнопка повернення */}
        <div className="mt-12 text-center">
          <button
            onClick={() => window.location.href = "/"}
            className="px-8 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all shadow-lg"
          >
            ← Volver al sitio
          </button>
        </div>
      </div>
    </div>
  );
}