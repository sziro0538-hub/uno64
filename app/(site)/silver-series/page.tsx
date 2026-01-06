"use client";

import PageBanner from "@/app/components/PageBanner";
import ModelsGrid from "@/app/components/ModelsGrid";

export default function SilverSeriesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <PageBanner page="silver_serie" />
        <ModelsGrid type="silver_serie" title="Silver Series" />
      </div>
    </div>
  );
}
