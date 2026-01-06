export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <p className="text-gray-600 mt-2">Welcome to admin panel</p>
      
      {/* 🔥 НОВІ КНОПКИ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <a 
          href="/admin/banners" 
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-8 rounded-2xl hover:shadow-xl transition-all duration-200 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            🖼️
          </div>
          <div>
            <h2 className="text-xl font-bold">Banners</h2>
            <p className="text-orange-100">Управління банерами</p>
          </div>
        </a>
        
        {/* Твої інші секції */}
      </div>
    </div>
  );
}
<div className="mt-8">
  <a href="/admin/banners" className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold">
    🖼️ Створити банер
  </a>
</div>
