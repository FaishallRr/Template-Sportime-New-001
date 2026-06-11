"use client";

import { useEffect, useState } from "react";

export default function DemoPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("demo-popup-dismissed");
    if (dismissed !== "true") {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem("demo-popup-dismissed", "true");
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        className="bg-surface rounded-3xl shadow-2xl max-w-sm w-full p-6 relative border border-outline-variant/20"
        style={{
          animation: "demo-popup-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center shadow-lg mb-4">
            <span className="material-symbols-outlined text-3xl text-on-primary">lock</span>
          </div>
          <h2 className="text-xl font-extrabold text-on-surface mb-2">Aplikasi Demo</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
            Seluruh data yang ditampilkan bersifat ilustrasi dan tidak terhubung dengan venue aktual.
          </p>
          <button
            onClick={dismiss}
            className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 active:brightness-90 transition-all cursor-pointer shadow-lg shadow-primary/25"
          >
            Mulai Jelajahi
          </button>
        </div>
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <span className="material-symbols-outlined text-outline text-lg">close</span>
        </button>
      </div>
      <style>{`
        @keyframes demo-popup-in {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
