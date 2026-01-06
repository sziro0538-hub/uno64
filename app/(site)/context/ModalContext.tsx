"use client";

import { createContext, useContext, useState } from "react";

type Tab = "login" | "register";

type ModalContextValue = {
  open: boolean;
  activeTab: Tab;
  openModal: (tab?: Tab) => void;
  closeModal: () => void;
  setActiveTab: (tab: Tab) => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("login");

  const openModal = (tab: Tab = "login") => {
    setActiveTab(tab);   // ← ВАЖЛИВО
    setOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setOpen(false);
    document.body.style.overflow = "";
  };

  return (
    <ModalContext.Provider
      value={{
        open,
        activeTab,
        openModal,
        closeModal,
        setActiveTab,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside ModalProvider");
  return ctx;
};
