"use client";

import { useEffect, useRef, useState, memo, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type NavVariant = "full" | "checkout" | "confirmation";
type ActivePage = "explore" | "bookings" | "profile" | "none";

interface NavbarProps {
  activePage?: ActivePage;
  variant?: NavVariant;
}

const Navbar = memo(function Navbar({
  activePage = "none",
  variant = "full",
}: NavbarProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ full_name: string; role: string } | null>(
    null,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="))
      ?.split("=")[1];
    const storedUser = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user="))
      ? decodeURIComponent(
          document.cookie
            .split("; ")
            .find((row) => row.startsWith("user="))
            ?.split("=")[1] || "{}",
        )
      : null;
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkClass = useMemo(() => (page: ActivePage) =>
    activePage === page
      ? "text-lime-600 font-bold border-b-2 border-lime-500 hover:text-lime-500 transition-colors duration-300"
      : "text-slate-600 font-medium hover:text-lime-500 transition-colors duration-300",
    [activePage],
  );

  const headerClass = useMemo(() =>
    scrolled
      ? "bg-white/80 shadow-md"
      : "bg-white/40",
    [scrolled],
  );

  const handleLogout = () => {
    document.cookie = "access_token=; path=/; max-age=0";
    document.cookie = "refresh_token=; path=/; max-age=0";
    document.cookie = "user=; path=/; max-age=0";
    setUser(null);
    router.push("/login");
  };

  /* ── Confirmation Navbar ── */
  if (variant === "confirmation") {
    return (
      <header className="bg-white/60 backdrop-blur-xl shadow-sm fixed top-0 w-full z-50 bg-gradient-to-b from-slate-200/20 to-transparent" style={{ willChange: "transform" }}>
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
          <Link href="/">
            <span className="text-2xl font-black italic text-slate-900 tracking-tighter cursor-pointer">
              SportTime
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-slate-600 font-medium tracking-tight">
              Booking Terkonfirmasi
            </span>
            <span
              className="material-symbols-outlined text-lime-500"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
          </div>
        </div>
      </header>
    );
  }

  /* ── Full Navbar (default) ── */
  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-xl shadow-sm ${headerClass}`}
      style={{ willChange: "transform" }}
    >
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto tracking-tight">
        <div className="flex items-center gap-8">
          <Link href="/">
            <span className="text-2xl font-black italic text-slate-900 tracking-tighter cursor-pointer">
              SportTime
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              id="nav-explore"
              className={linkClass("explore")}
              href="/explore"
            >
              Jelajahi
            </Link>
            {user && (
              <>
                <Link
                  id="nav-bookings"
                  className={linkClass("bookings")}
                  href="/my-bookings"
                >
                  Pemesanan Saya
                </Link>
                <Link
                  id="nav-profile"
                  className={linkClass("profile")}
                  href="/profile"
                >
                  Profil
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop: profile dropdown or Book Now */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative" ref={profileRef}>
                <div
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 bg-white/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/60 shadow-sm cursor-pointer hover:bg-white/90 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed shadow-sm font-black flex items-center justify-center text-lg">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant font-medium leading-none mb-0.5">Selamat datang,</p>
                    <p className="font-bold text-on-surface text-sm leading-none">{user.full_name.split(" ")[0]}</p>
                  </div>
                  <span className="material-symbols-outlined text-outline-variant transition-colors text-sm ml-1">expand_more</span>
                </div>
                <div
                  className={`absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden z-50 transition-all duration-300 transform origin-top-right ${profileOpen ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95"}`}
                >
                  <div className="p-2 space-y-1">
                    <Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-primary-container hover:text-on-primary-container transition-colors">
                      <span className="material-symbols-outlined text-lg">person</span>
                      Profil Saya
                    </Link>
                    <div className="h-px bg-slate-100 my-1 mx-2"></div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-error hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer text-left">
                      <span className="material-symbols-outlined text-lg">logout</span>
                      Keluar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login">
                <button className="bg-primary-fixed text-on-primary-fixed px-6 py-2.5 rounded-full font-bold scale-95 active:scale-90 transition-transform shadow-lg shadow-primary/20 btn-3d cursor-pointer min-h-[44px]">
                  Booking Sekarang
                </button>
              </Link>
            )}
          </div>

          {/* Mobile: trigger — avatar (logged in) or hamburger (logged out) */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Menu"
          >
            {user ? (
              <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed shadow-sm font-black flex items-center justify-center text-lg">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <span className="material-symbols-outlined text-slate-700">{mobileOpen ? "close" : "menu"}</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="md:hidden bg-white/95 backdrop-blur-2xl border-t border-slate-100 shadow-lg overflow-hidden"
          >
            <div className="px-6 py-4 space-y-2">
              <Link href="/explore" onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 min-h-[44px] ${activePage === "explore" ? "text-lime-600 bg-lime-50" : "text-slate-600 hover:bg-slate-50 hover:translate-x-1"}`}>
                <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${activePage === "explore" ? "" : "group-hover:scale-110"}`}>explore</span>
                Jelajahi
              </Link>
              {user && (
                <>
                  <Link href="/my-bookings" onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 min-h-[44px] ${activePage === "bookings" ? "text-lime-600 bg-lime-50" : "text-slate-600 hover:bg-slate-50 hover:translate-x-1"}`}>
                    <span className="material-symbols-outlined text-lg">calendar_month</span>
                    Pemesanan Saya
                  </Link>
                  <Link href="/profile" onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 min-h-[44px] ${activePage === "profile" ? "text-lime-600 bg-lime-50" : "text-slate-600 hover:bg-slate-50 hover:translate-x-1"}`}>
                    <span className="material-symbols-outlined text-lg">person</span>
                    Profil
                  </Link>
                  <hr className="border-slate-100 my-2" />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors cursor-pointer min-h-[44px]">
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Keluar
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
});
export default Navbar;
