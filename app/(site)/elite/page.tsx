"use client";

import PageBanner from "@/app/components/PageBanner";
import ModelsGrid from "@/app/components/ModelsGrid";

export default function Elite64Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <PageBanner page="elite64" />
        <ModelsGrid type="elite64" title="Elite 64" />
      </div>
    </div>
  );
}
