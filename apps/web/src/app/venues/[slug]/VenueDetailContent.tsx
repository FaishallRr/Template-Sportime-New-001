"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LazyImage from "@/components/LazyImage";

const SPORT_LABELS: Record<string, { label: string; icon: string }> = {
  padel: { label: "Padel", icon: "sports_tennis" },
  futsal: { label: "Futsal", icon: "sports_soccer" },
  basket: { label: "Basket", icon: "sports_basketball" },
  badminton: { label: "Badminton", icon: "sports_tennis" },
  tennis: { label: "Tennis", icon: "sports_tennis" },
  voli: { label: "Voli", icon: "sports_volleyball" },
  other: { label: "Olahraga", icon: "sports" },
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1622288302061-6d750c1f2ea1?w=800&q=80",
  "https://images.unsplash.com/photo-1585687838398-3c0e4b9e9d8f?w=800&q=80",
  "https://images.unsplash.com/photo-1566576942320-21f2e5e3529f?w=800&q=80",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
];

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      dateStr: d.toISOString().split("T")[0],
      month: d.toLocaleString("id-ID", { month: "short" }).toUpperCase(),
      day: d.getDate(),
      dow: d.toLocaleString("id-ID", { weekday: "short" }).toUpperCase(),
    });
  }
  return dates;
};

interface Slot {
  id: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "available" | "locked" | "booked";
  court_name: string;
  price_per_hour: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  user_name: string;
  initials: string;
  date: string;
}

const facilityIcons: Record<string, string> = {
  parking: "local_parking",
  parkir: "local_parking",
  shower: "shower",
  wifi: "wifi",
  cafe: "coffee",
  kantin: "restaurant",
  "sewa raket": "sports_tennis",
  equipment: "sports_tennis",
  locker: "lock",
  "kamar mandi": "shower",
};

const defaultAmenities = [
  { icon: "local_parking", label: "Parkir Gratis" },
  { icon: "shower", label: "Kamar Mandi & Shower" },
  { icon: "sports_tennis", label: "Sewa Raket & Bola" },
  { icon: "coffee", label: "Kantin & Bersantai" },
];

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatTime = (t: string | undefined | null) => {
  if (!t) return "--:--";
  const match = t.match(/(\d{2}:\d{2})/);
  return match ? match[1] : t.slice(0, 5);
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 15 },
  },
} as const;

const slotVariants = {
  initial: { scale: 0.85, opacity: 0 },
  animate: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { delay: i * 0.02, type: "spring" as const, stiffness: 120, damping: 12 },
  }),
  hover: { scale: 1.06, transition: { type: "spring" as const, stiffness: 300 } },
  tap: { scale: 0.92 },
} as const;

function Lightbox({ images, index, onClose, onPrev, onNext }: { images: string[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-5 right-5 z-10 text-white/80 hover:text-white text-3xl cursor-pointer transition-colors">
        <span className="material-symbols-outlined text-4xl">close</span>
      </button>
      <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl cursor-pointer transition-colors z-10">
        <span className="material-symbols-outlined text-5xl">chevron_left</span>
      </button>
      <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl cursor-pointer transition-colors z-10">
        <span className="material-symbols-outlined text-5xl">chevron_right</span>
      </button>
      <motion.img
        key={index}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        src={images[index]}
        alt=""
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
        {index + 1} / {images.length}
      </div>
    </motion.div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`skeleton-enhanced rounded-2xl ${className || ""}`} />;
}

export default function VenueDetailContent() {
  const params = useParams();
  const router = useRouter();
  const venueSlug = params.slug as string;

  const [venue, setVenue] = useState<any>(null);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [dates] = useState(generateDates());
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  useEffect(() => {
    fetch(`/api/venues/${venueSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setVenue(data.data);
          setVenueId(data.data.id);
        } else {
          setVenue(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setVenue(null);
        setLoading(false);
      });
  }, [venueSlug]);

  useEffect(() => {
    if (!venueId) return;
    setSlotsLoading(true);
    setSelectedSlotId(null);
    const dateStr = dates[selectedDateIdx].dateStr;
    fetch(`/api/venues/${venueId}/slots?date=${dateStr}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSlots(data.data || []);
        }
        setSlotsLoading(false);
      })
      .catch(() => {
        setSlotsLoading(false);
      });
  }, [venueId, selectedDateIdx, dates]);

  useEffect(() => {
    if (!venueId) return;
    fetch(`/api/venues/${venueId}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setReviews(data.data);
        }
      })
      .catch(() => {});
  }, [venueId]);

  const handleSlotClick = (slotId: string, status: string) => {
    if (status !== "available") return;
    setSelectedSlotId(slotId === selectedSlotId ? null : slotId);
  };

  const handleCheckout = () => {
    if (!selectedSlotId) return;
    const selectedSlot = slots.find((s) => s.id === selectedSlotId);
    if (!selectedSlot) return;

    const token = document.cookie.split("; ").find((row) => row.startsWith("access_token="))?.split("=")[1];
    if (!token) {
      router.push("/login");
      return;
    }

    sessionStorage.setItem(
      "checkoutData",
      JSON.stringify({
        venueId,
        venueName: venue?.name,
        slotId: selectedSlot.id,
        courtName: selectedSlot.court_name,
        date: selectedSlot.date,
        time: `${selectedSlot.start_time} - ${selectedSlot.end_time}`,
        price: selectedSlot.price_per_hour,
      })
    );

    router.push("/checkout");
  };

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const images = venue?.image_urls?.length > 0 ? venue.image_urls : fallbackImages;
  const amenities =
    venue?.facilities?.length > 0
      ? venue.facilities.map((f: string) => ({
          icon: facilityIcons[f.toLowerCase()] || "check_circle",
          label: f,
        }))
      : defaultAmenities;

  const openLightbox = (idx: number) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className="bg-surface text-on-background min-h-screen">
        <Navbar activePage="none" />
        <main className="max-w-7xl mx-auto px-6 py-8 pt-24 space-y-6">
          <SkeletonBlock className="h-[300px] md:h-[500px]" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <SkeletonBlock className="h-48" />
              <SkeletonBlock className="h-64" />
            </div>
            <div className="lg:col-span-4">
              <SkeletonBlock className="h-96" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <span className="material-symbols-outlined text-6xl text-slate-300">error</span>
        </motion.div>
        <h1 className="text-2xl font-bold text-slate-600">Lapangan Tidak Ditemukan</h1>
        <p className="text-slate-400">Lapangan mungkin telah dihapus atau tidak tersedia.</p>
        <Link href="/" className="text-primary underline">
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-background min-h-screen">
      <Navbar activePage="none" />

      <main className="max-w-7xl mx-auto px-6 py-8 pt-24">
        {/* Gallery */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[300px] md:h-[500px] mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-2xl group shadow-lg cursor-pointer"
            onClick={() => openLightbox(0)}
          >
            <LazyImage
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt={venue.name}
              src={images[0]}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
              <span className="text-white font-semibold tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined">fullscreen</span>
                Lihat Galeri
              </span>
            </div>
          </motion.div>
          {[1, 2, 3].map((i) =>
            images[i] ? (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03 }}
                className="relative overflow-hidden rounded-2xl group shadow-lg hidden md:block cursor-pointer"
                onClick={() => openLightbox(i)}
              >
                <LazyImage
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt={venue.name}
                  src={images[i]}
                />
              </motion.div>
            ) : !images[1] ? null : (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-slate-200 flex items-center justify-center hidden md:block">
                <span className="material-symbols-outlined text-4xl text-slate-400">photo_camera</span>
              </div>
            )
          )}
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-8 space-y-8"
          >
            {/* Venue Header */}
            <motion.div variants={itemVariants} className="glass-panel p-8 rounded-2xl shadow-sm border border-white/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-start gap-3 mb-2 flex-wrap">
                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-800 break-words gradient-text">{venue.name}</h1>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                      className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 flex items-center gap-1 shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {SPORT_LABELS[venue.sport_type || "other"]?.icon || "sports"}
                      </span>
                      {SPORT_LABELS[venue.sport_type || "other"]?.label || "Olahraga"}
                    </motion.span>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2 text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                    <a className="underline decoration-primary/30 hover:decoration-primary font-medium">{venue.address}</a>
                  </motion.div>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                  className="bg-primary-container px-4 py-2 rounded-xl text-center shadow-inner"
                >
                  <div className="text-2xl font-black text-on-primary-container">{venue.rating_avg.toFixed(1)}</div>
                  <div className="text-[10px] uppercase tracking-widest font-bold opacity-70">{venue.review_count} Ulasan</div>
                </motion.div>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-slate-600 leading-relaxed max-w-3xl"
              >
                {venue.description || "Fasilitas olahraga premium dengan kualitas lapangan terbaik untuk menunjang performa Anda."}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, staggerChildren: 0.05 }}
                className="flex flex-wrap gap-4 mt-6"
              >
                {amenities.map((a: { icon: string; label: string }, i: number) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ willChange: "transform" }}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-full border border-slate-200 shadow-sm cursor-default"
                  >
                    <motion.span
                      whileHover={{ rotate: 10 }}
                    style={{ willChange: "transform" }}
                      className="material-symbols-outlined text-primary text-lg"
                    >
                      {a.icon}
                    </motion.span>
                    <span className="text-sm font-bold text-slate-700">{a.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Booking Calendar & Slots */}
            <motion.div variants={itemVariants} className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-slate-100 relative">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                Pilih Tanggal & Waktu
              </h3>

              <div className="flex gap-4 overflow-x-auto pb-4 mb-8 snap-x scroll-smooth">
                {dates.map((d, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDateIdx(i)}
                    style={{ willChange: "transform" }}
                    className={`relative min-w-[80px] p-4 rounded-2xl text-center cursor-pointer transition-colors snap-start shadow-sm border ${
                      selectedDateIdx === i
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container-low hover:bg-surface-container-high border-slate-200"
                    }`}
                  >
                    {selectedDateIdx === i && (
                      <motion.div
                        layoutId="date-bg"
                        className="absolute inset-0 bg-primary rounded-2xl"
                        transition={{ type: "spring", stiffness: 200, damping: 30 }}
                      />
                    )}
                    <div className={`relative z-10 text-[10px] font-bold uppercase tracking-widest ${selectedDateIdx === i ? "opacity-90" : "opacity-50"}`}>{d.month}</div>
                    <div className={`relative z-10 text-2xl font-black my-1 ${selectedDateIdx === i ? "" : ""}`}>{d.day}</div>
                    <div className={`relative z-10 text-[10px] font-bold tracking-widest ${selectedDateIdx === i ? "opacity-90" : "opacity-50"}`}>{d.dow}</div>
                  </motion.button>
                ))}
              </div>

              <div className="relative min-h-[200px]">
                <AnimatePresence mode="wait">
                  {slotsLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl backdrop-blur-sm"
                    >
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="material-symbols-outlined text-3xl text-primary"
                      >
                        sync
                      </motion.span>
                    </motion.div>
                  ) : slots.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
                    >
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">event_busy</span>
                      <p className="text-slate-500 font-medium">Jadwal belum tersedia untuk tanggal ini.</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="slots"
                      initial="initial"
                      animate="animate"
                      variants={{
                        initial: {},
                        animate: { transition: { staggerChildren: 0.02 } },
                      }}
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                    >
                      <AnimatePresence>
                        {slots.map((slot, idx) => {
                          const isBooked = slot.status !== "available";
                          const isSelected = slot.id === selectedSlotId;

                          if (isBooked) {
                            return (
                              <motion.div
                                key={slot.id}
                                variants={slotVariants}
                                custom={idx}
                                className="p-4 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 w-16 h-16 bg-slate-200/50 blur-xl rounded-full pointer-events-none" />
                                <div className="text-sm font-bold opacity-50 line-through">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</div>
                                <div className="text-[10px] font-bold mt-1 opacity-50 uppercase">{slot.court_name}</div>
                                <div className="text-[9px] mt-1 px-2 py-0.5 bg-slate-200 rounded-full text-slate-500 font-bold">Terisi</div>
                              </motion.div>
                            );
                          }

                          return (
                            <motion.div
                              key={slot.id}
                              variants={slotVariants}
                              style={{ willChange: "transform" }}
                              custom={idx}
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => handleSlotClick(slot.id, slot.status)}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-colors flex flex-col items-center justify-center text-center relative overflow-hidden ${
                                isSelected
                                  ? "bg-primary text-on-primary ring-4 ring-primary/20 shadow-lg scale-[1.02]"
                                  : "border-slate-200 bg-white hover:border-primary/50 hover:bg-primary/5"
                              }`}
                            >
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1.5, opacity: 0 }}
                                  transition={{ duration: 0.5 }}
                                  className="absolute inset-0 bg-primary/30 rounded-full pointer-events-none"
                                />
                              )}
                              <div className={`text-sm font-bold ${isSelected ? "text-on-primary" : "text-slate-700 group-hover:text-primary"} transition-colors`}>
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </div>
                              <div className={`text-[10px] font-bold mt-1 uppercase tracking-wide ${isSelected ? "text-on-primary/80" : "text-slate-400"}`}>
                                {slot.court_name}
                              </div>
                              <div className={`text-xs font-bold mt-0.5 ${isSelected ? "text-on-primary/70" : "text-primary"}`}>
                                {formatRupiah(slot.price_per_hour)}
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow"
                                >
                                  <span className="material-symbols-outlined text-primary text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Reviews */}
            <motion.div variants={itemVariants} className="space-y-6 w-full overflow-hidden">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">rate_review</span>
                Ulasan Pengguna
              </h3>
              <AnimatePresence mode="wait">
                {reviews.length === 0 ? (
                  <motion.div
                    key="empty-review"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
                  >
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">rate_review</span>
                    <p className="text-slate-400 text-sm font-medium">Belum ada ulasan untuk venue ini.</p>
                    <p className="text-slate-300 text-xs mt-1">Jadilah yang pertama memberi ulasan!</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="reviews"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar"
                  >
                    {reviews.map((r) => (
                      <motion.div
                        key={r.id}
                        variants={itemVariants}
                        whileHover={{ y: -6, transition: { type: "spring", stiffness: 200 } }}
                        className="glass-panel p-6 rounded-2xl border border-slate-200 min-w-[280px] sm:min-w-[320px] snap-start shrink-0 shadow-sm"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary"
                          >
                            {r.initials}
                          </motion.div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{r.user_name}</div>
                            <div className="flex text-amber-400 text-xs mt-0.5">
                              {Array.from({ length: 5 }).map((_, j) => (
                                <motion.span
                                  key={j}
                                  initial={{ rotateY: 90, opacity: 0 }}
                                  animate={{ rotateY: 0, opacity: 1 }}
                                  transition={{ delay: j * 0.06, type: "spring", stiffness: 150 }}
                                  className="material-symbols-outlined text-[14px]"
                                  style={{ fontVariationSettings: j < r.rating ? "'FILL' 1, 'wght' 700" : "'FILL' 0, 'wght' 400" }}
                                >
                                  star
                                </motion.span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed italic">"{r.comment || "Tidak ada komentar."}"</p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Right Column: Booking Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-4 sticky top-24"
          >
            <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl relative overflow-hidden ring-1 ring-slate-800 summary-3d">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="absolute top-0 right-0 w-32 h-32 bg-primary blur-[80px] rounded-full pointer-events-none"
              />

              <h4 className="text-xl font-extrabold mb-6 text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Ringkasan
              </h4>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-sm text-slate-400">Tempat</span>
                  <span className="text-sm font-bold text-white text-right max-w-[150px] truncate">{venue.name}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-sm text-slate-400">Tanggal</span>
                  <span className="text-sm font-bold text-white">
                    {dates[selectedDateIdx] ? `${dates[selectedDateIdx].dow}, ${dates[selectedDateIdx].day} ${dates[selectedDateIdx].month}` : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-sm text-slate-400">Jadwal Dipilih</span>
                  <AnimatePresence mode="wait">
                    {selectedSlot ? (
                      <motion.div
                        key="selected"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="text-right"
                      >
                        <span className="text-sm font-bold text-white block">
                          {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                        </span>
                        <span className="text-[10px] text-primary font-bold uppercase">{selectedSlot.court_name}</span>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm font-medium text-slate-500 italic"
                      >
                        Belum ada
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <span className="font-bold text-slate-300">Total Harga</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={selectedSlot?.price_per_hour || 0}
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="text-2xl font-black text-primary truncate pl-2"
                    >
                      {selectedSlot ? formatRupiah(selectedSlot.price_per_hour) : "Rp 0"}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-4">
                <motion.button
                  whileHover={selectedSlotId ? { scale: 1.02 } : {}}
                  whileTap={selectedSlotId ? { scale: 0.98 } : {}}
                  onClick={handleCheckout}
                  disabled={!selectedSlotId}
                  className="w-full bg-primary text-on-primary py-4 rounded-xl font-extrabold text-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 relative overflow-hidden group"
                >
                  {selectedSlotId && (
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="absolute inset-0 bg-white/10 rounded-xl pointer-events-none"
                    />
                  )}
                  {selectedSlotId ? (
                    <>
                      Lanjut Pembayaran <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </>
                  ) : (
                    "Pilih Jadwal Dulu"
                  )}
                </motion.button>
                <p className="text-[10px] text-center text-slate-500 px-4 leading-relaxed">
                  Dengan menekan tombol, Anda menyetujui kebijakan pembatalan 24-jam & aturan keamanan lapangan.
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 p-6 bg-white rounded-2xl border border-slate-200"
            >
              <h5 className="font-bold text-sm mb-3 text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">headset_mic</span>
                Hubungi Admin SportTime
              </h5>
              <div className="flex items-center gap-3">
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  href="https://wa.me/62895703047094"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-slate-50 border border-slate-200 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <span className="material-symbols-outlined text-sm">chat</span> Chat WA
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  href="tel:+62895703047094"
                  className="flex-1 bg-slate-50 border border-slate-200 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <span className="material-symbols-outlined text-sm">call</span> Telpon
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer variant="minimal" />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            images={images}
            index={lightboxIdx}
            onClose={() => setLightboxOpen(false)}
            onPrev={() => setLightboxIdx((p) => (p === 0 ? images.length - 1 : p - 1))}
            onNext={() => setLightboxIdx((p) => (p === images.length - 1 ? 0 : p + 1))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
