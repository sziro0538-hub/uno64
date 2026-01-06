"use client";

import Navbar from "@/app/components/Navbar";
import AuthModal from "@/app/components/AuthModal";
import { ModalProvider } from "@/app/(site)/context/ModalContext";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNavbar = pathname !== "/";

  return (
    <ModalProvider>
      {showNavbar && <Navbar />}
      {children}
      <AuthModal />
    </ModalProvider>
  );
}
