"use client";

import Image from "next/image";

type Props = {
  page: string;       // назва сторінки
  height?: string;    // наприклад "h-[200px]" або "h-64" або "h-[30vh]"
};

export default function PageBanner({ page, height = "h-[220px]" }: Props) {

  const bannerMap: Record<string, string> = {
    basicos: "/pagebanner/basicos.png",
    premium: "/pagebanner/premium.png",
    rlc: "/pagebanner/rlc.png",
    elite64: "/pagebanner/elite.png",
  };

  const src = bannerMap[page.toLowerCase()] ?? "/pagebanner/default.png";

  return (
    <div
      className={`
        relative 
        w-full max-w-5xl mx-auto mt-6
        border-4 border-orange-500 rounded-2xl
        overflow-hidden bg-white
        ${height}     /* <- кастомна висота */
      `}
    >
      <Image
        src={src}
        alt={`${page} banner`}
        fill
        className="object-cover"   /* зображення по всій ширині */
        priority
      />
    </div>
  );
}
