"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const itemFadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const itemScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const sportBtnVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("q", searchQuery);
    if (searchDate) params.append("date", searchDate);
    router.push(`/explore?${params.toString()}`);
  };

  const sports = [
    { label: "Padel", sport: "padel", icon: "sports_tennis" },
    { label: "Futsal", sport: "futsal", icon: "sports_soccer" },
    { label: "Basket", sport: "basket", icon: "sports_basketball" },
    { label: "Badminton", sport: "badminton", icon: "sports_tennis" },
    { label: "Tennis", sport: "tennis", icon: "sports_tennis" },
    { label: "Voli", sport: "voli", icon: "sports_volleyball" },
  ];

  return (
    <section
      id="hero-section"
      aria-labelledby="hero-heading"
      className="relative min-h-[85vh] lg:min-h-[800px] flex items-center pt-53 pb-20 md:pb-28 overflow-hidden"
    >
      {/* Background blobs */}
      <div
        className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div className="absolute top-10 right-[-10%] w-[700px] h-[700px] bg-primary rounded-full blur-[140px] pulse-glow" />
        <div
          className="absolute bottom-20 left-[-5%] w-[500px] h-[500px] bg-primary-fixed rounded-full blur-[120px]"
          style={{ animation: "float-slow 8s ease-in-out infinite" }}
        />
      </div>

      {/* Floating 3D Ball */}
      <div
        className="absolute top-[25%] right-[45%] pointer-events-none z-0 opacity-40 xl:block hidden"
        aria-hidden="true"
        style={{ animation: "float-slow 10s ease-in-out infinite" }}
      >
        <div className="w-32 h-32 rounded-full border border-white/20 bg-gradient-to-br from-primary-fixed/40 to-transparent shadow-[inset_-8px_-8px_20px_rgba(0,0,0,0.1),8px_8px_20px_rgba(202,253,0,0.4)] backdrop-blur-md" />
      </div>

      <div className="container mx-auto px-6 lg:px-12 xl:px-21 grid md:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10 -mt-27 md:-mt-27">
        {/* Left content */}
        <motion.div
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemFadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-primary font-bold text-sm tracking-wide uppercase shadow-inner"
          >
            <span className="material-symbols-outlined text-sm">sports</span>
            Platform Olahraga Terdepan di Semarang
          </motion.div>

          <motion.h1
            variants={itemFadeUp}
            id="hero-heading"
            className="text-[2.5rem] leading-[1.1] md:text-7xl font-black text-on-surface tracking-tight md:tracking-tighter drop-shadow-sm break-words"
          >
            Sewa Lapangan <br />
            <span className="gradient-text inline-block py-1">Olahraga</span> di
            Semarang
          </motion.h1>

          <motion.p
            variants={itemFadeUp}
            className="text-xl text-on-surface-variant max-w-lg leading-relaxed"
          >
            Padel, Futsal, Basket, Badminton, Voli — pesan lapangan kapan saja,
            24 jam nonstop. Jadwal selalu update, harga jelas dan transparan,
            bayar pakai QRIS.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            variants={itemScale}
            className="p-2 glass-panel rounded-2xl shadow-xl shadow-on-surface/5 flex flex-col md:flex-row items-stretch md:items-center gap-2 max-w-2xl border border-white/40"
          >
            <div className="flex-1 flex items-center px-4 gap-3">
              <span className="material-symbols-outlined text-outline">
                location_on
              </span>
              <input
                id="search-venue-input"
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-on-surface py-4 font-medium placeholder:text-outline-variant"
                placeholder="Cari venue olahraga di Semarang..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cari venue olahraga"
              />
            </div>
            <div className="w-px h-8 bg-outline-variant/20 hidden md:block" />
            <div className="flex-1 flex items-center px-4 gap-3">
              <span className="material-symbols-outlined text-outline">
                calendar_month
              </span>
              <input
                id="search-date-input"
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-on-surface py-4 font-medium placeholder:text-outline-variant"
                placeholder="Pilih Tanggal"
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                aria-label="Pilih tanggal main"
              />
            </div>
            <button
              onClick={handleSearch}
              id="search-btn"
              className="bg-primary px-8 py-4 rounded-xl text-primary-fixed font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all btn-3d cursor-pointer shadow-lg shadow-primary/30"
              aria-label="Cari venue"
            >
              <span className="material-symbols-outlined">search</span>
              Cari
            </button>
          </motion.div>

          {/* Quick sport links */}
          <motion.div
            variants={itemFadeUp}
            className="flex flex-wrap gap-2 mt-2"
          >
            {sports.map((s, i) => (
              <motion.button
                key={s.sport}
                custom={i}
                variants={sportBtnVariants}
                onClick={() => router.push(`/explore?sport=${s.sport}`)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-white/50 backdrop-blur-sm border border-white/40 text-on-surface-variant text-sm font-medium hover:bg-primary hover:text-on-primary transition-all cursor-pointer min-h-[44px]"
              >
                <span className="material-symbols-outlined text-sm">
                  {s.icon}
                </span>
                {s.label}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Right image card */}
        <motion.div
          className="relative group max-w-[440px] w-full mx-auto flex justify-center"
          initial={{ opacity: 0, scale: 0.9, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
        >
          <div
            className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] rotate-3 blur-sm group-hover:rotate-2 transition-transform duration-500 w-full"
            aria-hidden="true"
          />
          <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-2xl tilt-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="w-full h-full object-cover"
              alt="Suasana lapangan olahraga modern dengan pencahayaan profesional di Semarang"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmtPRv5VfRtKi1dVKHAhs1eCAd86cmFkXJFyVKHrrBLPfqZoEtkMfLA0bejMZQgtLTdxzNcnkjdfC6hGC1nxeXnLxObnHreOmu2j_Wncx23Ax-9i0Ck4mJh2eUb5z5DE8a9ltSdFh5ZtxoU4XBc1E-jG6hodXfiLKkyUZY8I4Nb0OaO5hP-q1p1V1WEx6liGDiSzYj8erO6azG0mUUOSRPr2bTeRhmb-vi2gu9SPo6mI14Jgd-7x9X5bO0Z5qyMx8dKS4eZ2jp0dFX"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 glass-panel p-6 rounded-2xl border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">
                    Booking Online 24 Jam
                  </p>
                  <p className="text-white text-lg font-bold">
                    SportTime Arena
                  </p>
                </div>
                <span
                  className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-xs font-black"
                  style={{
                    animation: "shimmer-enhanced 2s ease-in-out infinite",
                  }}
                >
                  TERSEDIA
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
