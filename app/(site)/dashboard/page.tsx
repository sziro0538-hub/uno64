"use client";

import BannerBlock from "app/components/BannerBlock";  // ✅ Як AdminGuard!

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        
        {/* 🎨 БАНЕР DASHBOARD */}
        <BannerBlock slug="hero" />
        
        {/* Решта контенту */}
        <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 to-slate-900 bg-clip-text text-transparent text-center mb-20">
          Dashboard
        </h1>
        
        {/* Ваші cards без змін */}
        
      </div>
    </main>
  );
}
