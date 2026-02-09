'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  link?: string | null;
  image_url: string;
  button_label?: string | null;
  maps_url?: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 16;
const DESCRIPTION_LIMIT = 240;

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = events.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function openModal(event: Event) {
    setSelectedEvent(event);
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    setSelectedEvent(null);
    document.body.style.overflow = "auto";
  }

  if (loading) {
    return <div className="text-center py-12">Завантажуємо події...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900">Events</h1>

        {/* ✅ Збільшені картки 280px + нормальні відступи */}
        <div className="grid gap-y-8 gap-x-4 justify-items-center mb-12 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {paginatedEvents.map((event) => (
            <div
              key={event.id}
              className="
                w-full max-w-[260px] h-[320px] flex flex-col
                bg-white rounded-xl shadow-lg overflow-hidden
                hover:shadow-xl transition-all duration-200 cursor-pointer
              "
              onClick={() => openModal(event)}
            >
              <div className="h-[180px] overflow-hidden flex-shrink-0">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1" title={event.title}>
                    {event.title}
                  </h3>
                  <p className="text-base text-gray-600 line-clamp-1" title={event.location}>
                    {event.location}
                  </p>
                </div>
                <p className="text-base text-orange-600 font-semibold mt-auto">
                  {new Date(event.date).toLocaleDateString("uk-UA")}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Пагінація з адаптивністю */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center gap-2 px-4 pb-8">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className={`px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                currentPage === 1
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm"
              }`}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-all ${
                    currentPage === page
                      ? "bg-orange-500 text-white border-orange-500 shadow-md"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={`px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                currentPage === totalPages
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* МОДАЛКА з адаптивністю */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-start">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex-1 pr-4">{selectedEvent.title}</h2>
              <button
                onClick={closeModal}
                className="text-3xl text-gray-500 hover:text-gray-700 p-1 -m-1 rounded-full hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <img 
                src={selectedEvent.image_url} 
                alt={selectedEvent.title} 
                className="w-full h-48 sm:h-64 object-cover rounded-xl mb-4 sm:mb-6 shadow-lg" 
              />
              <div className="space-y-4 mb-6 sm:mb-8">
                <p className="text-gray-700 leading-relaxed text-sm line-clamp-20 max-h-[240px]">
                  {selectedEvent.description}
                </p>
                <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-gray-100">
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Date</span>
                    <p className="text-base sm:text-lg font-bold text-orange-500">
                      {new Date(selectedEvent.date).toLocaleDateString("uk-UA")}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">City</span>
                    <p className="font-bold text-gray-900 text-sm">{selectedEvent.location}</p>
                  </div>
                </div>
              </div>

              {selectedEvent.maps_url && (
                <a
                  href={selectedEvent.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full mb-4 sm:mb-6 border-2 border-orange-500 bg-transparent text-orange-600 font-semibold py-3 px-4 sm:px-6 rounded-xl text-center text-sm hover:bg-orange-50 hover:border-orange-600 transition-all shadow-sm hover:shadow-md"
                >
                  Map
                </a>
              )}

              {selectedEvent.link && (
                <a
                  href={selectedEvent.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-center shadow-lg hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                >
                  {selectedEvent.button_label || "КУПИТИ БІЛЕТ"}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}