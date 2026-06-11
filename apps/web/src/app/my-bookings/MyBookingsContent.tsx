"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActionButton from "@/components/FloatingActionButton";
import RevealOnScroll from "@/components/RevealOnScroll";
import LazyImage from "@/components/LazyImage";

/* ─── Animated Counter Hook ─── */
function useCountUp(target: number, enabled: boolean, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) {
      setCount(target);
      return;
    }
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled, duration]);
  return count;
}

/* ─── Types ─── */
type BookingStatus = "upcoming" | "completed" | "cancelled";
type FilterTab = "all" | BookingStatus;

interface Booking {
  id: string;
  venueName: string;
  venueLocation: string;
  courtNumber: number;
  courtType: string;
  date: string;
  dayLabel: string;
  timeStart: string;
  timeEnd: string;
  duration: string;
  price: string;
  status: BookingStatus;
  bookingCode: string;
  image: string;
  players: number;
  venueId?: string;
  venueSlug?: string;
}

const bookings: Booking[] = [];

/* ─── Status helpers ─── */
const statusConfig: Record<
  BookingStatus,
  { label: string; icon: string; bg: string; text: string; dot: string }
> = {
  upcoming: {
    label: "Upcoming",
    icon: "schedule",
    bg: "bg-primary-fixed/30",
    text: "text-primary",
    dot: "bg-primary-fixed",
  },
  completed: {
    label: "Selesai",
    icon: "check_circle",
    bg: "bg-surface-container-high/60",
    text: "text-on-surface-variant",
    dot: "bg-outline-variant",
  },
  cancelled: {
    label: "Dibatalkan",
    icon: "cancel",
    bg: "bg-error-container/20",
    text: "text-error",
    dot: "bg-error-container",
  },
};

const filterTabs: { key: FilterTab; label: string; icon: string }[] = [
  { key: "all", label: "Semua", icon: "list" },
  { key: "upcoming", label: "Upcoming", icon: "event_upcoming" },
  { key: "completed", label: "Selesai", icon: "task_alt" },
  { key: "cancelled", label: "Dibatalkan", icon: "event_busy" },
];

/* ─── Skeleton Loading ─── */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stat skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-panel rounded-2xl p-6 border border-white/50 flex items-center gap-5"
          >
            <div className="w-14 h-14 rounded-2xl skeleton-pulse" />
            <div className="space-y-2">
              <div className="w-16 h-8 skeleton-pulse rounded-lg" />
              <div className="w-20 h-4 skeleton-pulse rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* Card skeletons */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white/60 backdrop-blur-md rounded-[2rem] overflow-hidden border border-white/40"
        >
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-56 h-48 md:h-auto skeleton-pulse" />
            <div className="flex-1 p-6 md:p-8 space-y-4">
              <div className="h-6 w-48 skeleton-pulse rounded-lg" />
              <div className="h-4 w-32 skeleton-pulse rounded-lg" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-14 skeleton-pulse rounded-xl" />
                ))}
              </div>
              <div className="flex gap-4 pt-2">
                <div className="h-10 w-24 skeleton-pulse rounded-xl" />
                <div className="h-10 w-28 skeleton-pulse rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({
  icon,
  value,
  label,
  accent,
  revealed,
}: {
  icon: string;
  value: number;
  label: string;
  accent: string;
  revealed: boolean;
}) {
  const count = useCountUp(value, revealed);
  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/50 tilt-card flex items-center gap-5 group hover:shadow-xl transition-all duration-500">
      <div
        className={`w-14 h-14 rounded-2xl ${accent} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-[8deg] transition-all duration-500`}
      >
        <span className="material-symbols-outlined text-2xl text-white">
          {icon}
        </span>
      </div>
      <div>
        <p className="text-3xl font-black text-on-surface tabular-nums">
          {count}
        </p>
        <p className="text-sm text-on-surface-variant font-medium">{label}</p>
      </div>
    </div>
  );
}

/* ─── Booking Card ─── */
function BookingCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const cfg = statusConfig[booking.status];
  const isUpcoming = booking.status === "upcoming";

  const staggerClass = (i: number) =>
    `opacity-0 animate-[fadeIn_0.6s_ease-out_${0.3 + i * 0.08}s_forwards]`;

  return (
    <div
      id={`booking-${booking.id}`}
      className={`group bg-white/60 backdrop-blur-md rounded-[2rem] overflow-hidden border shadow-sm hover:shadow-2xl transition-all duration-500 tilt-card relative ${
        isUpcoming
          ? "border-primary-fixed/40 hover:border-primary-fixed/80"
          : "border-white/40 hover:border-white/60"
      }`}
    >
      {/* Gradient border glow on hover - upcoming only */}
      {isUpcoming && (
        <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-[-2px] rounded-[2rem] bg-gradient-to-r from-primary-fixed via-primary to-primary-fixed blur-sm" />
          <div className="absolute inset-0 rounded-[2rem] bg-white/60 backdrop-blur-md" />
        </div>
      )}

      <div className="relative z-10 flex flex-col md:flex-row">
        {/* Venue Image */}
        <div className="relative w-full md:w-56 h-48 md:h-auto overflow-hidden shrink-0">
          <LazyImage
            className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-[800ms] ease-out"
            alt={booking.venueName}
            src={booking.image}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent md:bg-gradient-to-r group-hover:from-black/50 group-hover:via-black/20 transition-all duration-500" />
          {/* Court badge */}
          <div className="absolute bottom-4 left-4 glass-panel px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5 backdrop-blur-xl">
            <span className="material-symbols-outlined text-xs text-white">
              grid_view
            </span>
            <span className="text-white text-xs font-bold">
              Court {booking.courtNumber}
            </span>
          </div>
          {/* Status badge overlay on image for mobile */}
          <div
            className={`absolute top-4 right-4 md:hidden inline-flex items-center gap-1 px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.text} text-xs font-bold shadow-lg`}
          >
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {cfg.icon}
            </span>
            {cfg.label}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between gap-4">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div style={{ animationDelay: "0.3s" }} className={staggerClass(0)}>
              <h3 className="text-xl font-bold text-on-surface mb-1">
                {booking.venueName}
              </h3>
              <p className="text-on-surface-variant text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  location_on
                </span>
                {booking.venueLocation}
              </p>
            </div>
            <div
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.text} text-xs font-bold shrink-0 shadow-sm ${
                isUpcoming ? "animate-pulse shadow-primary-fixed/20" : ""
              }`}
              style={{ animationDelay: "0.35s" }}
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {cfg.icon}
              </span>
              {cfg.label}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: "calendar_today",
                label: "TANGGAL",
                value: booking.dayLabel,
              },
              {
                icon: "schedule",
                label: "WAKTU",
                value: `${booking.timeStart} - ${booking.timeEnd}`,
              },
              { icon: "timer", label: "DURASI", value: booking.duration },
              {
                icon: "group",
                label: "PEMAIN",
                value: `${booking.players} orang`,
              },
            ].map((item, i) => (
              <div
                key={item.icon}
                className={`flex flex-col px-3 py-2.5 bg-white/40 rounded-xl group/detail hover:bg-white/60 hover:shadow-md transition-all duration-300 ${
                  isUpcoming ? "hover:border-primary-fixed/20" : ""
                }`}
                style={{ animationDelay: `${0.4 + i * 0.08}s` }}
              >
                <span className="text-[10px] uppercase tracking-wider text-outline font-bold">
                  {item.label}
                </span>
                <span className="text-sm font-black text-on-surface flex items-center gap-1 group-hover/detail:translate-x-0.5 transition-transform duration-300">
                  <span className="material-symbols-outlined text-xs text-primary group-hover/detail:scale-110 transition-transform duration-300">
                    {item.icon}
                  </span>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-white/30"
            style={{ animationDelay: "0.7s" }}
          >
            <div className="flex items-center gap-4">
              <div className="group/code">
                <p className="text-[10px] uppercase tracking-wider text-outline font-bold">
                  KODE BOOKING
                </p>
                <p className="text-sm font-black text-primary tracking-widest font-mono group-hover/code:tracking-[0.2em] transition-all duration-300">
                  {booking.bookingCode}
                </p>
              </div>
              <div className="w-px h-8 bg-outline-variant/20" />
              <div className="group/price">
                <p className="text-[10px] uppercase tracking-wider text-outline font-bold">
                  TOTAL
                </p>
                <p
                  className={`text-lg font-black ${isUpcoming ? "gradient-text" : "text-on-surface"} group-hover/price:scale-105 origin-left transition-transform duration-300`}
                >
                  {booking.price}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isUpcoming && (
                <>
                  <button
                    onClick={() =>
                      router.push(`/booking-confirmation?id=${booking.id}`)
                    }
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-primary-fixed text-on-primary-fixed font-bold text-sm btn-3d cursor-pointer hover:shadow-lg hover:shadow-primary-fixed/30 transition-all duration-300 min-h-[44px] active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm group-hover:animate-[wiggle_0.5s_ease-in-out]">
                      qr_code_2
                    </span>
                    Lihat QR
                  </button>
                  <button
                    onClick={() => {
                      if (booking.venueId)
                        router.push(
                          `/venues/${booking.venueSlug || booking.venueId}`,
                        );
                      else router.push("/explore");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/50 text-on-surface-variant font-bold text-sm hover:bg-white/80 hover:text-primary transition-all duration-300 cursor-pointer border border-white/40 active:scale-95 min-h-[44px]"
                  >
                    <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform duration-300">
                      edit_calendar
                    </span>
                    Booking Ulang
                  </button>
                </>
              )}
              {booking.status === "completed" && (
                <>
                  <button
                    onClick={() =>
                      router.push(`/booking-confirmation?id=${booking.id}`)
                    }
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-primary-fixed text-on-primary-fixed font-bold text-sm btn-3d cursor-pointer hover:shadow-lg hover:shadow-primary-fixed/30 transition-all duration-300 min-h-[44px] active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm group-hover:animate-[wiggle_0.5s_ease-in-out]">
                      confirmation_number
                    </span>
                    Lihat Tiket
                  </button>
                  <button
                    onClick={() => {
                      if (booking.venueId)
                        router.push(
                          `/venues/${booking.venueSlug || booking.venueId}`,
                        );
                      else router.push("/explore");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/50 text-on-surface-variant font-bold text-sm hover:bg-white/80 hover:text-primary transition-all duration-300 cursor-pointer border border-white/40 active:scale-95 min-h-[44px]"
                  >
                    <span className="material-symbols-outlined text-sm group-hover:rotate-[360deg] transition-transform duration-500">
                      replay
                    </span>
                    Book Lagi
                  </button>
                </>
              )}
              {booking.status === "cancelled" && (
                <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/50 text-on-surface-variant font-bold text-sm hover:bg-white/80 transition-all duration-300 cursor-pointer border border-white/40 active:scale-95 min-h-[44px]">
                  <span className="material-symbols-outlined text-sm">
                    info
                  </span>
                  Detail
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page Content ─── */
export default function MyBookingsContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [statsRevealed, setStatsRevealed] = useState(false);
  const router = useRouter();
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const fetchBookings = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.data) {
        const formatted: Booking[] = data.data.map((b: any) => {
          const fmtTime = (t: string) => {
            const m = String(t || "").match(/(\d{2}:\d{2})/);
            return m ? m[1] : (t || "").slice(0, 5);
          };
          const fmtDate = (d: string) => {
            if (!d) return "-";
            const clean = d.split("T")[0];
            const dt = new Date(clean + "T00:00:00");
            if (isNaN(dt.getTime())) return d;
            const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
            const months = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "Mei",
              "Jun",
              "Jul",
              "Agu",
              "Sep",
              "Okt",
              "Nov",
              "Des",
            ];
            return `${days[dt.getDay()]}, ${dt.getDate()} ${months[dt.getMonth()]}`;
          };
          const calcDur = (s: string, e: string) => {
            const sh = parseInt(fmtTime(s).split(":")[0]) || 0;
            const sm = parseInt(fmtTime(s).split(":")[1]) || 0;
            const eh = parseInt(fmtTime(e).split(":")[0]) || 0;
            const em = parseInt(fmtTime(e).split(":")[1]) || 0;
            const diff = eh * 60 + em - (sh * 60 + sm);
            if (diff <= 0) return "1 jam";
            if (diff % 60 === 0) return `${diff / 60} jam`;
            return `${Math.floor(diff / 60)} jam ${diff % 60} menit`;
          };
          return {
            id: b.id,
            venueName: b.venue_name || "-",
            venueLocation: b.venue_address || b.venue_name || "",
            courtNumber: 1,
            courtType: "Padel",
            date: b.slot_date || "",
            dayLabel: fmtDate(b.slot_date),
            timeStart: fmtTime(b.slot_time),
            timeEnd: fmtTime(b.slot_time_end || b.slot_time),
            duration: calcDur(b.slot_time, b.slot_time_end || b.slot_time),
            price: `Rp ${Number(b.booking_price || b.gross_amount || 0).toLocaleString("id-ID")}`,
            status: (() => {
              const today = new Date().toISOString().split("T")[0];
              const slot = b.slot_date || "";
              if (b.status === "cancelled") return "cancelled";
              if (slot < today) return "completed";
              return "upcoming";
            })(),
            bookingCode:
              b.verification_code || b.id.substring(0, 8).toUpperCase(),
            image: b.venue_image || "",
            venueId: b.venue_id || "",
            venueSlug: b.venue_slug || "",
            players: 4,
          };
        });
        setBookings(formatted);
      }
    } catch (e) {
      console.error("Failed to fetch bookings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="))
      ?.split("=")[1];
    if (!token) {
      router.push("/login");
    } else {
      setIsAuth(true);
      fetchBookings();
    }
  }, [router]);

  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsRevealed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  if (isAuth === null || loading) {
    return (
      <>
        <Navbar activePage="bookings" />
        <main className="pt-24 pb-12">
          <section className="relative overflow-hidden">
            <div className="container mx-auto px-6 py-12">
              <LoadingSkeleton />
            </div>
          </section>
        </main>
        <Footer />
        <FloatingActionButton />
      </>
    );
  }

  const filtered =
    activeFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === activeFilter);

  const upcomingCount = bookings.filter((b) => b.status === "upcoming").length;
  const completedCount = bookings.filter(
    (b) => b.status === "completed",
  ).length;
  const cancelledCount = bookings.filter(
    (b) => b.status === "cancelled",
  ).length;

  return (
    <>
      <Navbar activePage="bookings" />

      <main className="pt-24 pb-12">
        {/* ── Page Header ── */}
        <section className="relative overflow-hidden">
          {/* Background blobs */}
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-primary rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-[-5%] w-[300px] h-[300px] bg-primary-fixed rounded-full blur-[100px]" />
          </div>
          {/* Background particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]">
            <div
              className="absolute top-[15%] left-[10%] w-2 h-2 bg-primary rounded-full floating-element"
              style={{ animationDelay: "0s", animationDuration: "8s" }}
            />
            <div
              className="absolute top-[40%] right-[20%] w-3 h-3 bg-primary-fixed rounded-full floating-element"
              style={{ animationDelay: "1s", animationDuration: "10s" }}
            />
            <div
              className="absolute bottom-[25%] left-[30%] w-1.5 h-1.5 bg-primary rounded-full floating-element"
              style={{ animationDelay: "2s", animationDuration: "7s" }}
            />
            <div
              className="absolute top-[60%] left-[5%] w-2.5 h-2.5 bg-primary-fixed rounded-full floating-element"
              style={{ animationDelay: "0.5s", animationDuration: "9s" }}
            />
            <div
              className="absolute top-[10%] right-[35%] w-2 h-2 bg-primary rounded-full floating-element"
              style={{ animationDelay: "1.5s", animationDuration: "11s" }}
            />
          </div>

          <div className="container mx-auto px-6 py-12 relative z-10 -mt-9">
            <RevealOnScroll>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-primary font-bold text-sm tracking-wide uppercase shadow-inner mb-4">
                    <span className="material-symbols-outlined text-sm">
                      event_note
                    </span>
                    Booking Dashboard
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95]">
                    My <span className="gradient-text">Bookings</span>
                  </h1>
                  <p className="text-lg text-on-surface-variant mt-3 max-w-lg">
                    Kelola semua jadwal dan riwayat booking olahraga kamu di
                    satu tempat.
                  </p>
                </div>

                <button className="self-start md:self-auto bg-primary px-6 py-3 rounded-xl text-primary-fixed font-bold flex items-center gap-2 hover:bg-on-primary-container transition-all btn-3d cursor-pointer">
                  <span className="material-symbols-outlined">add</span>
                  Booking Baru
                </button>
              </div>
            </RevealOnScroll>

            {/* ── Stat Cards ── */}
            <RevealOnScroll delay={100}>
              <div
                ref={statsRef}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
              >
                <StatCard
                  icon="event_upcoming"
                  value={upcomingCount}
                  label="Upcoming"
                  accent="hero-gradient"
                  revealed={statsRevealed}
                />
                <StatCard
                  icon="task_alt"
                  value={completedCount}
                  label="Selesai"
                  accent="bg-tertiary"
                  revealed={statsRevealed}
                />
                <StatCard
                  icon="event_busy"
                  value={cancelledCount}
                  label="Dibatalkan"
                  accent="bg-error"
                  revealed={statsRevealed}
                />
              </div>
            </RevealOnScroll>

            {/* ── Filter Tabs ── */}
            <RevealOnScroll delay={200}>
              <div className="flex flex-wrap gap-2 mb-8 relative">
                {filterTabs.map((tab) => {
                  const isActive = activeFilter === tab.key;
                  const count =
                    tab.key === "all"
                      ? bookings.length
                      : bookings.filter((b) => b.status === tab.key).length;
                  return (
                    <button
                      key={tab.key}
                      id={`filter-${tab.key}`}
                      onClick={() => setActiveFilter(tab.key)}
                      className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-500 cursor-pointer overflow-hidden ${
                        isActive
                          ? "text-primary-fixed shadow-lg shadow-primary/20"
                          : "glass-panel text-on-surface-variant hover:bg-white/60 border border-white/40"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute inset-0 hero-gradient rounded-2xl animate-scaleIn" />
                      )}
                      <span className="material-symbols-outlined text-sm relative z-10">
                        {tab.icon}
                      </span>
                      <span className="relative z-10">{tab.label}</span>
                      <span
                        className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                          isActive
                            ? "bg-primary-fixed text-on-primary-fixed scale-100"
                            : "bg-white/50 text-on-surface scale-100"
                        }`}
                        style={{
                          transform: isActive ? "scale(1.1)" : "scale(1)",
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </RevealOnScroll>

            {/* ── Upcoming Notice ── */}
            {activeFilter !== "cancelled" &&
              activeFilter !== "completed" &&
              upcomingCount > 0 && (
                <RevealOnScroll delay={250}>
                  <div className="glass-panel rounded-2xl p-5 border border-primary-fixed/30 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 group hover:shadow-xl hover:border-primary-fixed/60 transition-all duration-500">
                    <div className="w-12 h-12 rounded-2xl hero-gradient flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-[6deg] transition-all duration-500">
                      <span className="material-symbols-outlined text-2xl text-on-primary">
                        notifications_active
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-on-surface">
                        Kamu punya {upcomingCount} booking yang akan datang! 🎾
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        Pastikan datang 15 menit sebelum jadwal dan bawa kode
                        booking-mu.
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse shrink-0" />
                  </div>
                </RevealOnScroll>
              )}

            {/* ── Booking Cards ── */}
            <div className="space-y-6">
              {filtered.map((booking, index) => (
                <RevealOnScroll key={booking.id} delay={300 + index * 100}>
                  <BookingCard booking={booking} />
                </RevealOnScroll>
              ))}

              {filtered.length === 0 && (
                <RevealOnScroll>
                  <div className="glass-panel rounded-[2rem] border border-white/50 p-16 text-center group hover:shadow-xl transition-all duration-500">
                    <div className="w-20 h-20 rounded-full bg-surface-container-high/50 flex items-center justify-center mx-auto mb-6 floating-element">
                      <span className="material-symbols-outlined text-4xl text-outline-variant">
                        event_busy
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-on-surface mb-2">
                      Belum Ada Booking
                    </h3>
                    <p className="text-on-surface-variant max-w-md mx-auto mb-6">
                      Kamu belum punya booking dengan status ini. Yuk booking
                      lapangan olahraga sekarang!
                    </p>
                    <button className="bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold btn-3d cursor-pointer hover:shadow-lg hover:shadow-primary-fixed/30 transition-all duration-300 active:scale-95">
                      <span className="material-symbols-outlined text-sm mr-1 align-middle">
                        add
                      </span>
                      Buat Booking
                    </button>
                  </div>
                </RevealOnScroll>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingActionButton />
    </>
  );
}
