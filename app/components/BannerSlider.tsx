"use client";

import { useEffect, useState } from "react";

const banners = [
  {
    id: 1,
    image: "/banners/banner-map-1.jpg",
    title: "Explore the City",
    subtitle: "Limited models around the world",
  },
  {
    id: 2,
    image: "/banners/banner-map-2.jpg",
    title: "Collectors Map",
    subtitle: "Find rare Hot Wheels",
  },
];

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-2xl">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={banner.image}
            alt={banner.title}
            className="w-full h-full object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Text */}
          <div className="absolute bottom-10 left-10 text-white">
            <h2 className="text-3xl font-bold">{banner.title}</h2>
            <p className="text-lg opacity-90">{banner.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
