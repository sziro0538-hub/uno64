"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Banner = {
  id: string;
  slug: string;
  title?: string | null;
  subtitle?: string | null;
  image_url?: string | null;
  size: "small" | "large";
  variant: "single" | "slider";
  align: "center" | "left" | "right";
  button_label?: string | null;
  button_url?: string | null;
  is_active: boolean;
};

interface BannerBlockProps {
  slug: string;  // dashboard, hero, promo...
  className?: string;
}

export default function BannerBlock({ slug, className = "" }: BannerBlockProps) {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanner();
  }, [slug]);

  const loadBanner = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      setBanner(data || null);
    } catch (error) {
      console.log(`No active banner for slug: ${slug}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (!banner) return null;

  return (
    <div className={`
      ${className}
      rounded-3xl shadow-2xl overflow-hidden relative
      ${banner.size === 'large' ? 'max-h-[400px] mb-12' : 'max-h-[250px] mb-8'}
      bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-xl
    `} 
    style={{
      backgroundImage: banner.image_url ? `url(${banner.image_url})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}
    role="banner"
  >
    {/* Overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/20 to-black/10"></div>
    
    {/* Content */}
    <div className={`
      relative z-10 h-full flex flex-col
      ${banner.align === 'left' ? 'items-start pl-12' : 
        banner.align === 'right' ? 'items-end pr-12' : 
        'items-center px-8'}
      justify-center text-white py-12 px-6 sm:px-12
    `}>
      {banner.title && (
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 drop-shadow-2xl leading-tight">
          {banner.title}
        </h2>
      )}
      
      {banner.subtitle && (
        <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-center opacity-95 drop-shadow-lg leading-relaxed">
          {banner.subtitle}
        </p>
      )}
      
      {banner.button_label && banner.button_url && (
        <a
          href={banner.button_url!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-white/90 hover:bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-white/50"
        >
          {banner.button_label}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      )}
    </div>
  </div>
);
}
