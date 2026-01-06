"use client";


import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";


interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}


type Profile = {
  id: string;
  nickname: string | null;
  bio: string | null;
  tiktok: string | null;
  url: string | null;
  avatar_url: string | null;
};


export default function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [profile, setProfile] = useState<Profile>({
    id: "",
    nickname: "",
    bio: "",
    tiktok: "",
    url: "",
    avatar_url: "",
  });


  // Завантажуємо профіль
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();


      if (!user) {
        setLoading(false);
        return;
      }


      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();


      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error);
      }


      if (data) {
        setProfile(data);
        setNicknameInput(data.nickname || "");
      }
    } catch (error) {
      console.error("Profile load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen, loadProfile]);


  // ✅ ВИПРАВЛЕНА - передає userId як параметр
  const saveField = useCallback(
    async (field: keyof Profile, value: string, userId: string) => {
      if (!userId) return;


      setSaving(true);


      try {
        const { error } = await supabase
          .from("profiles")
          .update({ [field]: value })
          .eq("id", userId);


        if (error) {
          console.error(`Error saving ${field}:`, error);
          await loadProfile();
        } else {
          // ✅ Оновлюємо локальний стан ПІСЛЯ успішного збереження
          setProfile((prev) => ({ ...prev, [field]: value }));
        }
      } catch (error) {
        console.error("Save error:", error);
        await loadProfile();
      } finally {
        setSaving(false);
      }
    },
    [loadProfile]
  );


  // ✅ Обробка аватара ВИПРАВЛЕНА
 const handleAvatarUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file || !profile.id) return;


  setSaving(true);
  try {
    // Видаляємо старі файли
    await supabase.storage
      .from("avatars")
      .remove([`${profile.id}/avatar.jpg`, `${profile.id}/avatar.png`]);


    // Завантажуємо новий з правильним путем
    const ext = file.name.split(".").pop()?.toLowerCase();
    const fileName = `${profile.id}/avatar.${ext}`;


    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });


    if (uploadError) {
      console.error("Upload error:", uploadError);
      setSaving(false);
      return;
    }


    // 🔑 Генеруємо публічний URL ПРАВИЛЬНО
    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
   
    console.log("Avatar URL:", data.publicUrl);


    // Зберігаємо у БД
    await saveField("avatar_url", data.publicUrl, profile.id);
   
    // Перезавантажуємо профіль
    await loadProfile();
  } catch (error) {
    console.error("Avatar upload error:", error);
  } finally {
    setSaving(false);
  }
};
  // ✅ Обробка всіх onBlur з userId
  const handleBioBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    saveField("bio", e.target.value, profile.id);
  };


  const handleTikTokBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    saveField("tiktok", e.target.value, profile.id);
  };


  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    saveField("url", e.target.value, profile.id);
  };


  // ✅ Збереження ніку
  const handleSaveNickname = async () => {
    if (!nicknameInput.trim()) {
      alert("El nombre no puede estar vacío");
      return;
    }
    await saveField("nickname", nicknameInput, profile.id);
    setEditingNickname(false);
  };


  if (!isOpen) return null;


  const firstChar =
    profile.nickname && profile.nickname.length > 0
      ? profile.nickname.charAt(0).toUpperCase()
      : "?";


  return (
    <>
      {/* затемнення */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 opacity-100 visible"
        onClick={onClose}
      />


      {/* сайдбар */}
      <div className="fixed top-0 right-0 h-full w-[320px] bg-white z-50 shadow-xl transition-transform duration-300 translate-x-0 overflow-y-auto">
        {/* Шапка */}
        <div className="bg-gray-200 px-5 py-6 rounded-bl-2xl flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            {/* Аватар — клік для завантаження */}
            {/* Аватар — клік для завантаження */}
{/* Аватар — клік для завантаження */}
{/* Аватар — клік для завантаження */}
{/* Аватар — клік для завантаження */}
<label className="relative group cursor-pointer">
  {profile.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt="avatar"
      className="w-20 h-20 rounded-full object-cover shadow-lg group-hover:opacity-75 transition-opacity"
    />
  ) : (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:opacity-75 transition-opacity">
      {firstChar}
    </div>
  )}


  {/* ✅ Тільки камера при наведенні */}
  <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
    <svg
      className="w-6 h-6 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  </div>


  <input
    type="file"
    accept="image/*"
    onChange={handleAvatarUpload}
    disabled={saving}
    className="hidden"
  />
</label>




{/* Нікнейм з редагуванням — z-index щоб був поверх камери */}
<div className="flex-1 relative z-10 ml-4">
  {editingNickname ? (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={nicknameInput}
        onChange={(e) => setNicknameInput(e.target.value)}
        maxLength={20}
        className="px-2 py-1 border border-orange-300 rounded text-sm focus:ring-2 focus:ring-orange-400"
        autoFocus
      />
      <button
        onClick={handleSaveNickname}
        disabled={saving}
        className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 disabled:opacity-50"
      >
        Guardar
      </button>
      <button
        onClick={() => {
          setEditingNickname(false);
          setNicknameInput(profile.nickname || "");
        }}
        disabled={saving}
        className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
      >
        Cancelar
      </button>
    </div>
  ) : (
    <div>
      <div
        onClick={() => setEditingNickname(true)}
        className="text-lg font-semibold text-gray-700 cursor-pointer hover:text-orange-600 transition-colors"
      >
        {loading
          ? "Cargando..."
          : profile.nickname || "Sin nombre"}
      </div>
      <div className="text-xs text-gray-500">
        ID: {profile.id ? profile.id.slice(0, 8) + "..." : "----"}
      </div>
    </div>
  )}
</div>


          </div>


          <button
  onClick={onClose}
  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
>
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
</button>


        </div>


        {/* Форма профілю */}
        <div className="px-6 py-6 space-y-4">
          {/* Опис — БЕЗ скролінгу, адаптивний розмір */}
{/* Опис — БЕЗ скролінгу, адаптивний розмір */}
{/* Опис — БЕЗ скролінгу, адаптивний розмір */}
{/* Опис — БЕЗ скролінгу, адаптивний розмір */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Descripción
  </label>
  <textarea
    maxLength={120}
    placeholder="Cuéntanos sobre ti (máx. 120 caracteres)..."
    value={profile.bio || ""}
    onChange={(e) =>
      setProfile((p) => ({ ...p, bio: e.target.value }))
    }
    onBlur={handleBioBlur}
    disabled={loading || saving}
    style={{
      resize: "none",
      overflow: "hidden",
      minHeight: "110px",
      maxHeight: "250px",
      lineHeight: "1.5",
      fontFamily: "inherit"
    }}
    className="w-full px-3 py-2 bg-white rounded-md border border-gray-300 text-gray-700 text-sm focus:ring-0 focus:border-orange-500 focus:outline-none disabled:opacity-50 transition-all"
    onInput={(e) => {
      const target = e.target as HTMLTextAreaElement;
      target.style.height = "auto";
      target.style.height = Math.min(target.scrollHeight, 250) + "px";
    }}
  />
  <div className="text-xs text-gray-500 mt-1">
    {(profile.bio || "").length}/120
  </div>
</div>



{/* TikTok */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    TikTok
  </label>
  <input
    type="text"
    placeholder="@tu_tiktok"
    value={profile.tiktok || ""}
    onChange={(e) =>
      setProfile((p) => ({ ...p, tiktok: e.target.value }))
    }
    onBlur={handleTikTokBlur}
    disabled={loading || saving}
    className="w-full px-3 py-2 bg-white rounded-md border border-gray-300 text-gray-700 text-sm focus:ring-0 focus:border-orange-500 focus:outline-none disabled:opacity-50 transition-all"
  />
</div>


{/* URL */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Enlace
  </label>
  <input
    type="url"
    placeholder="Instagram, web, etc."
    value={profile.url || ""}
    onChange={(e) =>
      setProfile((p) => ({ ...p, url: e.target.value }))
    }
    onBlur={handleUrlBlur}
    disabled={loading || saving}
    className="w-full px-3 py-2 bg-white rounded-md border border-gray-300 text-gray-700 text-sm focus:ring-0 focus:border-orange-500 focus:outline-none disabled:opacity-50 transition-all"
  />
</div>


        </div>


        {/* Меню */}
        <div className="px-6 py-6 space-y-4 border-t border-gray-100">
          <div
            className="cursor-pointer hover:text-orange-500 p-2 rounded-lg hover:bg-orange-50 text-gray-700 text-base transition-colors"
            onClick={() => {
              onClose();
              window.location.href = `/profile/${profile.id}`;
            }}
          >
            Mi Colección
          </div>
          <div className="cursor-pointer hover:text-orange-500 p-2 rounded-lg hover:bg-orange-50 text-gray-700 text-base transition-colors">
            Mis Favoritos
          </div>
          <div
            className="cursor-pointer hover:text-orange-500 p-2 rounded-lg hover:bg-orange-50 text-gray-700 text-base transition-colors"
            onClick={() => {
              onClose();
              window.location.href = "/huntermap";
            }}
          >
            Hunter Map
          </div>


          {/* LOGOUT */}
          <div className="mt-8">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              disabled={saving}
              className="w-full py-3 text-center text-lg font-medium border border-orange-500 rounded-lg text-orange-600 transition-all hover:bg-orange-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cerrar sesión
            </button>
          </div>
        </div>


        {saving && (
          <div className="absolute bottom-4 left-4 right-4 bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 rounded text-xs text-center">
            Guardando...
          </div>
        )}
      </div>
    </>
  );
}