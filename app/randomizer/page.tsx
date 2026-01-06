"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const generateSessionName = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const randomLetter = () =>
    letters[Math.floor(Math.random() * letters.length)];
  const randomDigit = () =>
    digits[Math.floor(Math.random() * digits.length)];
  const suffix =
    randomLetter() +
    randomLetter() +
    randomLetter() +
    randomDigit() +
    randomDigit();
  return `Random${suffix}`;
};

// Код, який копіює кнопка Proof of Random
const randomProofSnippet = `function generateRandomNumber(rangeMax) {
  return Math.floor(Math.random() * (rangeMax + 1));
}`;

export default function RandomizerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({ numbers: 1, range: 49 });
  const [isSpinning, setIsSpinning] = useState(false);

  const [currentSlots1, setCurrentSlots1] = useState<number[]>([]);
  const [currentSlots2, setCurrentSlots2] = useState<number[]>([]);
  const [finalResult, setFinalResult] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);

  const [results, setResults] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [lastSessionName, setLastSessionName] = useState<string | null>(null);

  const spinTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadResults = async () => {
    const { data } = await supabase
      .from("randomizers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(55);
    setResults(data || []);
    setVisibleCount(5);
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        router.push("/");
        return;
      }

      if (!isMounted) return;

      setUser(session.user);
      setLoading(false);
      loadResults();
    };

    init();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
        router.push("/");
      } else {
        setUser(session.user);
        setLoading(false);
        loadResults();
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
      if (spinTimeout.current) clearTimeout(spinTimeout.current);
    };
  }, [router]);

  const slotsCount = 9;
  const centerIndex = 4;

  const generateRandomNumber = (rangeMax: number) => {
    return Math.floor(Math.random() * (rangeMax + 1));
  };

  const startSpin = () => {
    setIsSpinning(true);
    setShowResult(false);
    setHasSpun(true);

    const initial1 = Array(slotsCount)
      .fill(0)
      .map(() => generateRandomNumber(settings.range));
    setCurrentSlots1(initial1);

    if (settings.numbers === 2) {
      const initial2 = Array(slotsCount)
        .fill(0)
        .map(() => generateRandomNumber(settings.range));
      setCurrentSlots2(initial2);
    } else {
      setCurrentSlots2([]);
    }

    let time = 0;
    let speed = 50;

    const animate = () => {
      const new1 = Array(slotsCount)
        .fill(0)
        .map(() => generateRandomNumber(settings.range));
      setCurrentSlots1(new1);

      if (settings.numbers === 2) {
        const new2 = Array(slotsCount)
          .fill(0)
          .map(() => generateRandomNumber(settings.range));
        setCurrentSlots2(new2);
      }

      time += speed;

      if (time > 2000) {
        speed = Math.min(speed * 1.15, 200);
      }

      if (time >= 3500) {
        if (spinTimeout.current) {
          clearTimeout(spinTimeout.current);
          spinTimeout.current = null;
        }
        finishSpin();
      } else {
        spinTimeout.current = setTimeout(animate, speed) as any;
      }
    };

    animate();
  };

  const finishSpin = async () => {
    const result: number[] = [];
    for (let i = 0; i < settings.numbers; i++) {
      result.push(generateRandomNumber(settings.range));
    }

    const finalSlots1 = Array(slotsCount)
      .fill(0)
      .map(() => generateRandomNumber(settings.range));
    finalSlots1[centerIndex] = result[0];
    setCurrentSlots1(finalSlots1);

    if (settings.numbers === 2) {
      const finalSlots2 = Array(slotsCount)
        .fill(0)
        .map(() => generateRandomNumber(settings.range));
      finalSlots2[centerIndex] = result[1];
      setCurrentSlots2(finalSlots2);
    } else {
      setCurrentSlots2([]);
    }

    setFinalResult(result);
    setIsSpinning(false);
    setShowResult(true);

    if (user?.id) {
      const name = generateSessionName();
      await supabase.from("randomizers").insert({
        user_id: user.id,
        name,
        mode_numbers: settings.numbers,
        range_max: settings.range,
        result_first: result[0],
        ...(settings.numbers === 2 && { result_second: result[1] }),
      });
      setLastSessionName(name);
      loadResults();
    }
  };

  const newSpin = () => {
    if (spinTimeout.current) {
      clearTimeout(spinTimeout.current);
      spinTimeout.current = null;
    }
    setShowResult(false);
    setFinalResult([]);
    setCurrentSlots1([]);
    setCurrentSlots2([]);
    setIsSpinning(false);
    setHasSpun(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600 animate-pulse">
          Cargando...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const primaryBtn =
    "px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all duration-200 active:scale-[0.98]";
  const outlineBtn =
    "px-8 py-3 border-2 border-orange-500 text-orange-500 hover:bg-orange-50 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]";

  const renderRow = (slots: number[], isWinnerRow: boolean) => (
    <div
      className={`grid grid-cols-9 gap-3 mb-4 transition-all duration-300 ${
        isSpinning ? "scale-105" : "scale-100"
      }`}
    >
      {Array(slotsCount)
        .fill(0)
        .map((_, i) => {
          const num =
            slots.length === slotsCount ? slots[i] : 0;
          const isCenter = i === centerIndex;
          const isWinner =
            showResult && isCenter && isWinnerRow && finalResult.length > 0;

          const baseClasses =
            "w-20 h-20 flex items-center justify-center text-2xl font-bold rounded-xl transition-all duration-300";

          const normalClasses =
            "bg-gray-100 text-gray-900 border border-gray-200";
          const centerClasses =
            "bg-white text-orange-500 border-2 border-orange-500";
          const winnerClasses =
            "bg-orange-500 text-white border-2 border-orange-500 scale-110 shadow-lg";

          const finalClasses = isWinner
            ? `${baseClasses} ${winnerClasses}`
            : isCenter
            ? `${baseClasses} ${centerClasses}`
            : `${baseClasses} ${normalClasses}`;

          return (
            <div
              key={i}
              className={finalClasses}
              style={{
                animation: isWinner ? "bounce 0.5s ease-in-out" : "none",
              }}
            >
              {num.toString().padStart(2, "0")}
            </div>
          );
        })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">
            RANDOMIZER
          </h1>
          <div className="w-16 h-1 bg-gray-900 mx-auto mt-4"></div>
        </div>

        {!showResult && !isSpinning && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
            <div className="max-w-3xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Cantidad de números
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 rounded-xl cursor-pointer border border-orange-300 bg-white transition-all hover:bg-orange-50 has-[:checked]:bg-orange-50 has-[:checked]:border-orange-500">
                      <input
                        type="radio"
                        name="numbers"
                        value={1}
                        checked={settings.numbers === 1}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            numbers: +e.target.value,
                          })
                        }
                        className="w-4 h-4 text-orange-500 outline-none focus:outline-none focus:ring-0"
                      />
                      <span className="ml-3 font-medium text-gray-900">
                        1 número
                      </span>
                    </label>
                    <label className="flex items-center p-4 rounded-xl cursor-pointer border border-orange-300 bg-white transition-all hover:bg-orange-50 has-[:checked]:bg-orange-50 has-[:checked]:border-orange-500">
                      <input
                        type="radio"
                        name="numbers"
                        value={2}
                        checked={settings.numbers === 2}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            numbers: +e.target.value,
                          })
                        }
                        className="w-4 h-4 text-orange-500 outline-none focus:outline-none focus:ring-0"
                      />
                      <span className="ml-3 font-medium text-gray-900">
                        2 números
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Rango
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 rounded-xl cursor-pointer border border-orange-300 bg-white transition-all hover:bg-orange-50 has-[:checked]:bg-orange-50 has-[:checked]:border-orange-500">
                      <input
                        type="radio"
                        name="range"
                        value={49}
                        checked={settings.range === 49}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            range: +e.target.value,
                          })
                        }
                        className="w-4 h-4 text-orange-500 outline-none focus:outline-none focus:ring-0"
                      />
                      <span className="ml-3 font-medium text-gray-900">
                        00-49
                      </span>
                    </label>
                    <label className="flex items-center p-4 rounded-xl cursor-pointer border border-orange-300 bg-white transition-all hover:bg-orange-50 has-[:checked]:bg-orange-50 has-[:checked]:border-orange-500">
                      <input
                        type="radio"
                        name="range"
                        value={99}
                        checked={settings.range === 99}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            range: +e.target.value,
                          })
                        }
                        className="w-4 h-4 text-orange-500 outline-none focus:outline-none focus:ring-0"
                      />
                      <span className="ml-3 font-medium text-gray-900">
                        00-99
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={startSpin}
                disabled={isSpinning}
                className="mx-auto mt-10 block w-64 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl text-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                Empezar
              </button>
            </div>
          </div>
        )}

        {hasSpun && (
          <div className="mb-8">
            <div className="flex flex-col items-center">
              {renderRow(currentSlots1, true)}
              {settings.numbers === 2 && renderRow(currentSlots2, true)}

              {showResult && (
                <div className="text-center space-y-8 animate-fadeIn">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 uppercase tracking-wider">
                      Resultado
                    </p>
                    <div className="text-8xl font-bold text-gray-900 tracking-tight">
                      {finalResult.map((r, i) => (
                        <span key={i}>
                          {r.toString().padStart(2, "0")}
                          {i < finalResult.length - 1 && (
                            <span className="text-5xl mx-3 text-gray-400">
                              ,
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 justify-center pt-4">
                    <button onClick={newSpin} className={primaryBtn}>
                      Nuevo
                    </button>
                    <button
                      onClick={async () => {
                        if (!lastSessionName) return;
                        const text = `🎰 ${lastSessionName}\nResultado: ${finalResult
                          .map((r) => r.toString().padStart(2, "0"))
                          .join(", ")}\n${
                          settings.numbers
                        } número${
                          settings.numbers > 1 ? "s" : ""
                        } • 00-${settings.range}\nhttps://tudominio.com/randomizer`;
                        await navigator.clipboard.writeText(text);
                        alert("✅ Copiado al portapapeles");
                        router.push("/randomizer");
                      }}
                      className={outlineBtn}
                    >
                      Compartir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Últimos resultados
            </h3>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
              {results.length}
            </span>
          </div>

          <div className="space-y-3">
            {results.slice(0, visibleCount).map((result) => (
              <div
                key={result.id}
                className="flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group"
              >
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                  {result.name}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">
                    {result.mode_numbers} • 00-{result.range_max}
                  </span>
                  <span className="text-2xl font-bold text-gray-900 min-w-[80px] text-right">
                    {result.result_first
                      .toString()
                      .padStart(2, "0")}
                    {result.result_second &&
                      `, ${result.result_second
                        .toString()
                        .padStart(2, "0")}`}
                  </span>
                </div>
              </div>
            ))}

            {results.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">🎰</div>
                <p className="text-lg font-medium mb-2">
                  Sin resultados
                </p>
                <p className="text-sm">
                  Haz tu primer giro para ver el historial
                </p>
              </div>
            )}

            {results.length > visibleCount && visibleCount < 55 && (
              <button
                onClick={() =>
                  setVisibleCount((prev) => Math.min(prev + 10, 55))
                }
                className="mx-auto mt-4 block w-64 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-sm font-medium transition-all"
              >
                Mostrar más
              </button>
            )}
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 text-center">
            <p className="text-xs text-gray-500 mb-4">
              Este sitio utiliza una generación completamente aleatoria.
              Puedes comprobarlo copiando el código que usamos para generar los números.
            </p>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(randomProofSnippet);
                alert("✅ Código de generación copiado");
              }}
              className="mx-auto block w-48 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl text-xs font-medium transition-all"
            >
              Proof of Random
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%,
          100% {
            transform: scale(1.1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
