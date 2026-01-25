"use client";

import BannerBlock from "@/app/components/BannerBlock";
import ModelsGrid from "@/app/components/ModelsGrid";

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <BannerBlock slug="rlc" />
        <ModelsGrid type="premium" title="Premium" />
      </div>
    </div>
  );
}
