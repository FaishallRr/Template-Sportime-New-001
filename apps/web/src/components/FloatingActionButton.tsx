"use client";

export default function FloatingActionButton() {
  return (
    <a
      href="https://wa.me/62895703047094"
      target="_blank"
      rel="noreferrer"
      id="chat-fab"
      className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-primary-fixed text-on-primary-fixed shadow-2xl flex items-center justify-center z-[100] transition-all btn-3d cursor-pointer pulse-glow"
      aria-label="Open chat"
    >
      <span className="material-symbols-outlined text-3xl">chat</span>
    </a>
  );
}
