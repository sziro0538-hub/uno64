"use client";

import PageBanner from "@/app/components/PageBanner";
import ModelsGrid from "@/app/components/ModelsGrid";

export default function BasicosPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <PageBanner page="basicos" />
        {/* наш новий грід-блок */}
        <ModelsGrid type="basicos" title="Basicos" />
      </div>
    </div>
  );
}
