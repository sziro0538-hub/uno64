import React, { ReactNode, useEffect } from "react";


type Props = {
  children: ReactNode;
  show: boolean;
  onClose: () => void;
};


export default function Modal({ children, show, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);


  if (!show) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />


      {/* modal box */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl p-6 animate-fadeIn">
          {children}
        </div>
      </div>
    </div>
  );
}