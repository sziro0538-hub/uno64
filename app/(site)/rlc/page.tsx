"use client";

import BannerBlock from "@/app/components/BannerBlock";

import ModelsGrid from "@/app/components/ModelsGrid";

export default function RlcPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <BannerBlock slug="basicos" />
        <ModelsGrid type="rlc" title="RLC" />
      </div>
    </div>
  );
}
