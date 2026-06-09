"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./DashboardContext";
import { useEffect } from "react";

export interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: number;
}

interface SidebarNavProps {
  items: NavItem[];
  brandTitle: string;
  brandSubtitle: string;
  accentColor?: "blue" | "green";
}

export default function SidebarNav({
  items,
  brandTitle,
  brandSubtitle,
  accentColor = "blue",
}: SidebarNavProps) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/mitra") return pathname === href;
    return pathname.startsWith(href);
  };

  const activeClass =
    accentColor === "blue"
      ? "bg-blue-50 text-blue-700 border-l-[3px] border-blue-600"
      : "bg-lime-50 text-lime-700 border-l-[3px] border-lime-600";

  const hoverClass =
    accentColor === "blue"
      ? "hover:bg-blue-50/50 hover:text-blue-600"
      : "hover:bg-lime-50/50 hover:text-lime-600";

  const accentDot =
    accentColor === "blue" ? "bg-blue-500" : "bg-lime-500";

  const accentGradient =
    accentColor === "blue"
      ? "from-blue-600 to-blue-500"
      : "from-lime-600 to-lime-500";

  return (
    <>
      {/* ── Mobile Overlay ── */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <aside
        className={`
          w-72 bg-white border-r border-slate-200/80 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl md:shadow-sm
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:w-64
        `}
      >
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <Link href={accentColor === "blue" ? "/admin" : "/mitra"} onClick={close}>
              <div className="flex items-center gap-3 cursor-pointer">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentGradient} flex items-center justify-center shadow-lg`}>
                  <span className="material-symbols-outlined text-white text-xl">
                    {accentColor === "blue" ? "admin_panel_settings" : "storefront"}
                  </span>
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900">
                    {brandTitle}
                  </h1>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                    {brandSubtitle}
                  </p>
                </div>
              </div>
            </Link>
            {/* Close button (mobile only) */}
            <button
              onClick={close}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Close sidebar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Navigation Menu Section */}
        <div className="px-3 pt-4 pb-2">
          <p className="px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">
            Menu
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-grow px-3 space-y-1 overflow-y-auto pb-4">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group relative ${
                  isActive(item.href)
                    ? activeClass
                    : `text-slate-500 ${hoverClass}`
                }`}
              >
                <span
                  className={`material-symbols-outlined text-xl transition-transform duration-200 ${
                    isActive(item.href) ? "" : "group-hover:scale-110"
                  }`}
                  style={
                    isActive(item.href)
                      ? { fontVariationSettings: "'FILL' 1" }
                      : undefined
                  }
                >
                  {item.icon}
                </span>
                <span className="flex-grow">{item.label}</span>
                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                {/* Active indicator dot */}
                {isActive(item.href) && (
                  <span className={`w-1.5 h-1.5 rounded-full ${accentDot} absolute right-3`} />
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 py-3 border-t border-slate-100 space-y-1">
          {/* Help */}
          <a href="https://wa.me/62895703047094" target="_blank" rel="noreferrer" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-xl">help_outline</span>
            <span>Bantuan</span>
          </a>
          {/* Back to Main */}
          <Link href="/" onClick={close}>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
              <span>Kembali ke Beranda</span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
