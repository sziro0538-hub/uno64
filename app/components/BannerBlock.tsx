"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

/* ================= TYPES ================= */

type Banner = {
  id: string;
  slug: string;
  title?: string | null;
  subtitle?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  size: "small" | "large";
  variant: "single" | "slider";
  align: "center" | "left" | "right";
  button_label?: string | null;
  button_url?: string | null;
  is_active: boolean;
};

interface Props {
  slug: string;
  className?: string;
}

/* ================= COMPONENT ================= */

export default function BannerBlock({ slug, className = "" }: Props) {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ================= LOAD ================= */

  useEffect(() => {
    loadBanner();
  }, [slug]);

  const loadBanner = async () => {
    const { data } = await supabase
      .from("banners")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    setBanner(data || null);
    setIndex(0);
  };

  /* ================= AUTOSWIPE ================= */

  useEffect(() => {
    if (banner?.variant === "slider" && banner.images?.length) {
      startAuto();
      return stopAuto;
    }
  }, [banner, index]);

  const startAuto = () => {
    stopAuto();
    timerRef.current = setTimeout(() => {
      setIndex((prev) =>
        prev + 1 >= (banner?.images?.length || 1) ? 0 : prev + 1
      );
    }, 5000); // ⏱ 5 секунд
  };

  const stopAuto = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  if (!banner) return null;

  const images =
    banner.variant === "slider" && banner.images?.length
      ? banner.images
      : banner.image_url
      ? [banner.image_url]
      : [];

  /* ================= UI ================= */

  return (
    <section
      className={`relative overflow-hidden rounded-3xl shadow-2xl ${className}
      ${banner.size === "large" ? "h-[380px] mb-12" : "h-[240px] mb-8"}`}
    >
      {/* ===== SLIDER ===== */}
      <div
        className="absolute inset-0 flex transition-transform duration-700 ease-in-out"
        style={{
          width: `${images.length * 100}%`,
          transform: `translateX(-${index * (100 / images.length)}%)`,
        }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            className="h-full bg-cover bg-center"
            style={{
              width: `${100 / images.length}%`,
              backgroundImage: `url(${img})`,
            }}
          />
        ))}
      </div>

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-black/10 z-10" />

      {/* CONTENT */}
      <div
        className={`relative z-20 h-full flex flex-col justify-center text-white px-10
        ${
          banner.align === "left"
            ? "items-start text-left"
            : banner.align === "right"
            ? "items-end text-right"
            : "items-center text-center"
        }`}
      >
        {banner.title && (
          <h2 className="text-3xl md:text-5xl font-black mb-4 drop-shadow-xl">
            {banner.title}
          </h2>
        )}

        {banner.subtitle && (
          <p className="max-w-2xl text-lg md:text-xl opacity-95 mb-6">
            {banner.subtitle}
          </p>
        )}

        {banner.button_label && banner.button_url && (
          <a
            href={banner.button_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition"
          >
            {banner.button_label}
          </a>
        )}
      </div>

      {/* DOTS */}
      {banner.variant === "slider" && images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-3 h-3 rounded-full transition
              ${i === index ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
