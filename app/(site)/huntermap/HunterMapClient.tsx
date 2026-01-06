"use client";

import { useEffect, useState } from "react";
import { useMapEvents } from "react-leaflet";
import { MapWrapper, TileLayer, Marker, Popup } from "./MapWrapper";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "@/lib/supabase";

// Фіксимо дефолтну іконку Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Оранжевий маркер
const markerIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type MarkerRow = {
  id: number;
  user_id: string;
  lat: number;
  lng: number;
  city: string | null;
  nickname: string;
  bio: string;
};

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function HunterMapClient() {
  const [markers, setMarkers] = useState<MarkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftMarker, setDraftMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [myMarker, setMyMarker] = useState<MarkerRow | null>(null);

  // Завантажуємо юзера один раз
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    loadUser();
  }, []);

// Завантажуємо маркери + окремо профілі
useEffect(() => {
  const loadMarkers = async () => {
    const { data: markersData, error: markersError } = await supabase
      .from("hunter_markers")
      .select("id, user_id, lat, lng, city");

    if (markersError) {
      console.error("Error loading markers:", markersError);
      setLoading(false);
      return;
    }

    // Завантажуємо профілі для всіх user_id з маркерів
    const userIds = (markersData as MarkerRow[])?.map((m) => m.user_id) || [];
    let profilesData = {};
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nickname, bio")
        .in("id", userIds);

      if (!profilesError) {
        profilesData = profiles.reduce((acc: any, p: any) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }
    }

    const loadedMarkers: MarkerRow[] = (markersData as any[])?.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      lat: row.lat,
      lng: row.lng,
      city: row.city,
      nickname: profilesData[row.user_id]?.nickname || "Coleccionista",
      bio: profilesData[row.user_id]?.bio || "",
    })) || [];

    setMarkers(loadedMarkers);
    
    // Знаходимо маркер поточного юзера
    if (userId) {
      const my = loadedMarkers.find((m) => m.user_id === userId);
      setMyMarker(my || null);
    }
    
    setLoading(false);
  };

  if (userId) {
    loadMarkers();
  }
}, [userId]);


  const startPicking = () => {
    setPicking(true);
    setDraftMarker(null);
  };

  const handlePick = (lat: number, lng: number) => {
    setDraftMarker({ lat, lng });
    setPicking(false);
  };

 const handleSave = async () => {
  if (!draftMarker || !userId) return;
  setSaving(true);

  // Видаляємо старий маркер
  await supabase.from("hunter_markers").delete().eq("user_id", userId);

  const { data, error } = await supabase
    .from("hunter_markers")
    .insert({
      user_id: userId,
      lat: draftMarker.lat,
      lng: draftMarker.lng,
    })
    .select("id, user_id, lat, lng, city")
    .single();

  setSaving(false);

  if (error) {
    console.error("Error saving marker:", error);
    return;
  }

  // Завантажуємо профіль окремо для нового маркера
  const { data: profileData } = await supabase
    .from("profiles")
    .select("nickname, bio")
    .eq("id", userId)
    .single();

  const newMarker: MarkerRow = {
    id: data.id,
    user_id: data.user_id,
    lat: data.lat,
    lng: data.lng,
    city: data.city,
    nickname: profileData?.nickname || "Coleccionista",
    bio: profileData?.bio || "",
  };

  setMarkers((prev) => [...prev.filter((m) => m.user_id !== userId), newMarker]);
  setMyMarker(newMarker);
  setDraftMarker(null);
};


  const handleDelete = async () => {
    if (!userId || !myMarker) return;

    const { error } = await supabase
      .from("hunter_markers")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting marker:", error);
      return;
    }

    setMarkers((prev) => prev.filter((m) => m.user_id !== userId));
    setMyMarker(null);
    setDraftMarker(null);
  };

  const center: [number, number] = [40.4168, -3.7038];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-semibold text-center mb-1">HUNTER MAP</h1>
        <p className="text-center text-gray-500 mb-4">Coleccionismo cerca de ti!</p>

        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <button
            onClick={startPicking}
            disabled={picking || saving}
            className={`px-4 py-2 rounded-md text-sm text-white ${
              picking || saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {draftMarker ? "Mover marcador" : "Añadir"}
          </button>

          {draftMarker && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-md text-sm text-white ${
                saving ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          )}

          {myMarker && !draftMarker && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-md text-sm bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar
            </button>
          )}

          {picking && (
            <span className="text-sm text-gray-600">
              Haz click en el mapa para elegir la ubicación.
            </span>
          )}
        </div>

        <div className="h-[500px] rounded-lg overflow-hidden border">
          <MapWrapper center={center} zoom={6} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {picking && <ClickToPick onPick={handlePick} />}

            {draftMarker && (
              <Marker position={[draftMarker.lat, draftMarker.lng]} icon={markerIcon} />
            )}

            {!loading &&
              markers.map((m) => (
                <Marker key={m.id} position={[m.lat, m.lng]} icon={markerIcon}>
                  <Popup>
                    <div className="text-sm min-w-[200px]">
                      <div className="font-semibold text-orange-600">
                        {m.nickname}
                      </div>
                      <div className="text-gray-600 mt-1">
                        {m.bio || "Sin descripción"}
                      </div>
                      {m.city && (
                        <div className="text-xs text-gray-500 mt-1">{m.city}</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapWrapper>
        </div>
      </div>
    </div>
  );
}
