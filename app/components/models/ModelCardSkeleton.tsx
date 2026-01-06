export default function ModelCardSkeleton() {
  return (
    <div className="w-1/2 md:w-1/3 lg:w-1/4 p-2">
      <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">

        {/* Фото зона (aspect ratio 3:4) */}
        <div className="relative bg-gray-200 animate-pulse aspect-[3/4]">
          <div className="absolute top-2 right-2 h-5 w-14 bg-gray-300 rounded-full animate-pulse" />
        </div>

        {/* Назва */}
        <div className="px-3 mt-3">
          <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse" />
        </div>

        {/* Лайки / дизлайки / шер */}
        <div className="flex items-center gap-4 px-3 mt-3">
          <div className="h-4 w-10 bg-gray-300 rounded animate-pulse" />
          <div className="h-4 w-10 bg-gray-300 rounded animate-pulse" />
          <div className="h-4 w-10 bg-gray-300 rounded animate-pulse" />
        </div>

        {/* Теги */}
        <div className="flex gap-2 px-3 mt-3 mb-4">
          <div className="h-6 w-14 bg-gray-300 rounded-full animate-pulse" />
          <div className="h-6 w-20 bg-gray-300 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
