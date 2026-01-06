"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect } from "react";
import Modal from "./Modal";
import { useModal } from "@/app/(site)/context/ModalContext";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthModal() {
  const { open, closeModal, activeTab } = useModal();
  const router = useRouter();

  useEffect(() => {
  const { data: listener } = supabase.auth.onAuthStateChange(
    (event: string, session: Session | null) => {
      console.log("AUTH EVENT:", event);

      if (event === "SIGNED_IN") {
        closeModal();
        router.replace("/dashboard");
      }

      if (event === "SIGNED_UP") {
        alert("Cuenta creada con éxito. Por favor verifica tu email.");
      }
    }
  );

  return () => listener.subscription.unsubscribe();
}, [router, closeModal]);


  return (
    <Modal show={open} onClose={closeModal}>
      <h2 className="text-xl font-semibold mb-4 text-white">
        {activeTab === "login" ? "Iniciar sesión" : "Registrarse"}
      </h2>

      <Auth
        supabaseClient={supabase}
        view={activeTab === "login" ? "sign_in" : "sign_up"}
        providers={["google"]}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: "#f35618ff",
                brandAccent: "#f35618ff",
              },
            },
          },
        }}
      />
    </Modal>
  );
}
