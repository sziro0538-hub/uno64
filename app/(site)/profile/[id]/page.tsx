"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

type Profile = {
  id: string;
  nickname: string | null;
  bio: string | null;
  tiktok: string | null;
  url: string | null;
  avatar_url: string | null;
};

type Badge = {
  name: string;
  image_url: string;
  level_required: number;
};

type UserBadge = {
  position: number;
  badge: Badge;
};

export default function ProfilePage() {
  const params = useParams();
  const profileId = params?.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;

    const loadData = async () => {
      try {
        // PROFILE
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, nickname, bio, tiktok, url, avatar_url")
          .eq("id", profileId)
          .single();

        if (profileError) {
          console.error(profileError);
        } else {
          setProfile(profileData);
        }

        // BADGES
        const { data: badgesData, error: badgesError } = await supabase
          .from("user_selected_badges")
          .select(`
            position,
            badge:badges (
              name,
              image_url,
              level_required
            )
          `)
          .eq("user_id", profileId)
          .order("position", { ascending: true });

        if (badgesError) {
          console.error(badgesError);
        } else if (badgesData) {
          setBadges(badgesData as unknown as UserBadge[]);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profileId]);

  const handleShare = async () => {
    if (!profile) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${profile.nickname ?? ""}`,
          url: window.location.href,
        });
      } catch {}
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg animate-pulse">Cargando perfil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">Perfil no encontrado</div>
      </div>
    );
  }

  const firstChar = profile.nickname?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-6">

            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-24 h-24 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {firstChar}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">

                <h1 className="text-2xl font-bold text-gray-800">
                  {profile.nickname || "Sin nombre"}
                </h1>

                <div className="flex items-center gap-4">
                  {/* TikTok */}
                  {profile.tiktok && (
                    <a
                      href={`https://tiktok.com/@${profile.tiktok.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600 transition"
                    >
                      🎵 TikTok
                    </a>
                  )}

                  {/* URL */}
                  {profile.url && (
                    <a
                      href={profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600 transition"
                    >
                      🔗 Enlace
                    </a>
                  )}

                  {/* Share */}
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600 transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342l6.632 3.316m-6.632-6l6.632-3.316"
                      />
                    </svg>
                    Share
                  </button>
                </div>
              </div>

              {profile.bio && (
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {profile.bio}
                </p>
              )}

              {/* BADGES */}
              <div className="flex gap-2 mt-4">
                {badges.length > 0 ? (
                  badges.map((userBadge) => (
                    <div
                      key={userBadge.position}
                      className="w-12 h-12 rounded-full shadow-md overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition-all"
                      title={`${userBadge.badge.name} - Level ${userBadge.badge.level_required}`}
                    >
                      <img
                        src={userBadge.badge.image_url}
                        alt={userBadge.badge.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 italic">
                    Sin insignias seleccionadas
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLLECTION */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Mi Colección
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="aspect-[2/3] border-2 border-dashed border-orange-300 rounded-lg flex items-center justify-center hover:border-orange-500 cursor-pointer transition-colors">
              <span className="text-6xl text-orange-400">+</span>
            </div>

            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-[2/3] border-2 border-gray-200 rounded-lg bg-gray-50"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
