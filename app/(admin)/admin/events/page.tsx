"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import EventFormModal from "@/app/components/admin/EventFormModal";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  image_url?: string;
  created_at: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) {
      console.error("Error loading events:", error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }

  async function deleteEvent(id: string) {
    if (!confirm("Ви впевнені, що хочете видалити цю подію?")) return;

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      alert("Помилка при видаленні");
    } else {
      setEvents(events.filter((e) => e.id !== id));
    }
  }

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Управління подіями</h1>
        <button
          onClick={() => {
            setEditingEvent(null);
            setShowModal(true);
          }}
          className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
        >
          + Нова подія
        </button>
      </div>

      <input
        type="text"
        placeholder="Пошук по назві..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-400 focus:outline-none"
      />

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Назва
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Дата
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Місце
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                Дії
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Завантаження...
                </td>
              </tr>
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Немає подій
                </td>
              </tr>
            ) : (
              filteredEvents.map((event) => (
                <tr key={event.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 font-medium">{event.title}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(event.event_date).toLocaleDateString("uk-UA")}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{event.location || "-"}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => {
                        setEditingEvent(event);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Видалити
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <EventFormModal
          event={editingEvent}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
          }}
          onSave={() => {
            loadEvents();
            setShowModal(false);
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
}
