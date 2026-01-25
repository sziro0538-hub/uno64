"use client";

import BannerBlock from "@/app/components/BannerBlock";
import ModelsGrid from "@/app/components/ModelsGrid";

export default function SilverSeriesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <BannerBlock slug="basicos" />
        <ModelsGrid type="silver_serie" title="Silver Series" />
      </div>
    </div>
  );
}
