"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ProfileSidebar from "./ProfileSidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const router = useRouter();

  // Перевіряємо чи є активна сесія
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLogged(!!data.session);
    });
  }, []);

  const tabs = [
    { label: "Basicos", href: "/basicos" },
    { label: "Premium", href: "/premium" },
    { label: "RLC", href: "/rlc" },
    { label: "Elite64", href: "/elite" },
    { label: "CHECK", href: "/checkin" },
    { label: "Eventos", href: "/eventos" },
    { label: "Randomizer", href: "/randomizer" },
    { label: "Hunter Map", href: "/huntermap" },
  ];

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-2">
      <div className="flex items-center justify-between">

        {/* 🔥 ЛОГО (оновлена логіка кліку) */}
        {isLogged ? (
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center cursor-pointer"
          >
            <img
              src="/logo2.png"
              alt="UNO64 Logo"
              className="object-contain w-[120px]"
            />
          </button>
        ) : (
          <div className="flex items-center opacity-60 cursor-default">
            <img
              src="/logo2.png"
              alt="UNO64 Logo"
              className="object-contain w-[120px]"
            />
          </div>
        )}

        {/* ПОШУК + ТАБИ */}
        <div className="flex flex-col items-center flex-1">

          {/* ПОШУКОВЕ ПОЛЕ */}
          <input
            type="text"
            placeholder="Buscar"
            className="
              w-[500px] max-w-full
              px-4 py-2 rounded-md bg-gray-100 text-gray-700 
              border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:outline-none
            "
          />

          {/* ТАБИ */}
          <div className="flex gap-8 mt-2">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="
                  text-gray-500 hover:text-gray-700 relative pb-1
                  transition group
                "
              >
                {tab.label}

                <span
                  className="
                    absolute left-0 right-0 mx-auto bottom-0
                    w-0 h-[3px] bg-orange-500 rounded
                    group-hover:w-full
                    transition-all duration-300
                  "
                />
              </Link>
            ))}
          </div>
        </div>

        {/* КНОПКА ПРОФІЛЮ */}
        <button
          onClick={() => setOpenSidebar(true)}
          className="
            w-10 h-10 flex items-center justify-center 
            rounded-full border-[2px] border-[#ff7a00]
            hover:bg-orange-50 transition
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff7a00"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="7" r="4" />
            <path d="M4.5 21a9 9 0 0 1 15 0" />
          </svg>
        </button>
      </div>

      {/* САЙДБАР */}
      <ProfileSidebar
        isOpen={openSidebar}
        onClose={() => setOpenSidebar(false)}
      />
    </nav>
  );
}
