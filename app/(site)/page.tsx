"use client";

import { useModal } from "@/app/(site)/context/ModalContext";

export default function HomePage() {
  const { openModal } = useModal();

  const handleLogin = () => {
    openModal("login");
  };

  const handleRegister = () => {
    openModal("register");
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center pt-20">
      {/* ЛОГО */}
      <img
        src="/logo2.png"
        alt="UNO64 Logo"
        className="w-[160px] object-contain mb-6"
      />

      {/* СЛОГАН */}
      <h1 className="text-3xl font-semibold text-gray-800 text-center">
        Esto es más que coleccionar
      </h1>

      <p className="text-gray-500 text-center mt-2">
        Explora, guarda y comparte tus modelos favoritos.
      </p>

      {/* КНОПКИ */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={handleLogin}
          className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
        >
          Iniciar sesión
        </button>

        <button
          onClick={handleRegister}
          className="px-6 py-2 border border-orange-600 text-orange-600 rounded-md hover:bg-orange-600 hover:text-white transition"
        >
          Registrarse
        </button>
      </div>
    </div>
  );
}
