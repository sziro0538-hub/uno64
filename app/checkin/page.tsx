"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function CheckinPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [badgesCount, setBadgesCount] = useState(0);
  const router = useRouter();

  const handleCheckin = async () => {
    setLoading(true);
    setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("¡Inicia sesión!");
        return;
      }

      // ✅ ПРОСТА ЛОГІКА ТЕСТУ
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setBadgesCount(Math.floor(Math.random() * 5) + 1); // ТЕСТ 1-5
      setMessage("¡Check-in exitoso! Badges de prueba: " + badgesCount);
    } catch (error: any) {
      setMessage("¡Error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Daily Check-in</h1>
        <p className="text-gray-600 mb-8">¡Haz check-in diario!</p>
        
        <button
          onClick={handleCheckin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-8 rounded-xl font-semibold text-lg shadow-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all mb-6"
        >
          {loading ? "Comprobando..." : "¡Check-in Hoy!"}
        </button>
        
        {message && (
          <div className="p-4 rounded-xl mb-4 bg-green-100 text-green-800 border border-green-200">
            {message}
          </div>
        )}
        
        <div className="text-2xl font-bold text-orange-600 bg-orange-100 p-4 rounded-xl">
          Badges: {badgesCount}
        </div>
        
        <button onClick={() => router.push('/')} className="mt-6 text-orange-600 hover:text-orange-700 font-semibold">
          ← Volver
        </button>
      </div>
    </div>
  );
}
