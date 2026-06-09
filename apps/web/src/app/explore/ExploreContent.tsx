"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const VenueMap = dynamic(() => import("@/components/VenueMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-container-low flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 skeleton-enhanced rounded-full" />
        <p className="text-sm text-outline font-medium">Memuat peta...</p>
      </div>
    </div>
  ),
});

interface Venue {
  id: string;
  slug: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  facilities: string[];
  image_urls: string[];
  status: string;
  sport_type?: string;
  rating_avg: number;
  review_count: number;
  distance_km?: number;
}

const SPORT_FILTERS: { value: string; label: string; icon: string }[] = [
  { value: "", label: "Semua", icon: "apps" },
  { value: "padel", label: "Padel", icon: "sports_tennis" },
  { value: "futsal", label: "Futsal", icon: "sports_soccer" },
  { value: "basket", label: "Basket", icon: "sports_basketball" },
  { value: "badminton", label: "Badminton", icon: "sports_tennis" },
  { value: "voli", label: "Voli", icon: "sports_volleyball" },
];

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
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBrxWwBgpuw5wh7CRQifZekBiYKTp_-XxzSHEwHjOWw1iWPwCgBvBBsiATVPRK0WiT0jn4VmhQFFq9LDRf6oc3Mxiyx8nNAEif0qbsDXLZ8mECmewm9PDUmrmdh1GQ1Zybeqyjj0nYlFWydSmwH_O0BwQfACBsYqDDmHQy4Ly2E3jEAd4O57r8Fut3o6tUcYNWBzCVrMmXorrvXGCeS_z1V58t5C1uiHkqIz0zPbccOMqWcFec7a5ncCK1FsjzmuMkFfZs8HrMWdoVd",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDuLqxHTdqKoLGH2E6rEqezfAQVmbtwSW1V4vtJF4m2l1Vpzl4AYnzHMMnb5CKJkW0SSRYEVQZMuFeteBHHhJ_1NNnyhz5pqsnvbXYFqqmKsfCWPUBuYmuHvLw8pERyiQ82ZX7BnwsT1GazZ23yRoyZW6IQ_RBJPOxi_GyHvioceSzCESODFoJO_QoCfWm-DKvy--NiX6Qc66WrFRZ0GbEI9W8-L7lqiU9LZgFAVH6XUVxmfWSa-T2_YeWwY3QtCwXgnsUfnknJkqNN",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBnr5rt-Q7HG553SVbb_0ATvIgs2Z9BJF3tmc9b6HmremScANNCAtWymiLlHzjTqQsam4ZZCjX_gGwTDSib1XeP-EMsP8wrmA0oqD8LF980qXesOTTIEtUDJUzbsp4B5LleGla1oHs-lEwkd62yjuY3g6oDmUzRQtiX-aoPGULwgiCkuAsangK8t8BhwM1vM02Eur_uNTA1e0xV8qj72d65WsgRuzIiAwFCvu-QoJEM0ibsXZgTbvLguYUvQ-Qu3TID2xkzhQiB5UnR",
];

const facilityIcons: Record<string, string> = {
  Parking: "directions_car",
  Shower: "shower",
  Equipment: "sports_tennis",
  Cafe: "local_cafe",
  WiFi: "wifi",
  Bistro: "restaurant",
  "Pro Shop": "shopping_bag",
  "Kamar Mandi": "shower",
  "Sewa Raket": "sports_tennis",
  Loker: "storage",
  Kantin: "restaurant",
};

function VenueCard({
  venue,
  index,
  isSelected,
  onSelect,
}: {
  venue: Venue;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const imageUrl =
    venue.image_urls?.length > 0
      ? venue.image_urls[0]
      : fallbackImages[index % fallbackImages.length];

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`venue-card-3d bg-surface-container-lowest rounded-2xl overflow-hidden cursor-pointer group shadow-sm transition-all duration-300 ${
        isSelected
          ? "ring-2 ring-primary/70 shadow-lg shadow-primary/20 scale-[1.02]"
          : "hover:shadow-xl"
      }`}
    >
      <div className="relative h-44 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          alt={venue.name}
          src={imageUrl}
        />
        {/* Image gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        {/* Shine hover effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-700 pointer-events-none" />
        {venue.distance_km !== undefined && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-on-surface shadow-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-primary">
              near_me
            </span>
            {venue.distance_km} km
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          <div className="bg-white/80 backdrop-blur-md px-3 py-0.5 rounded-full text-xs font-bold text-on-surface shadow-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-primary">
              {SPORT_LABELS[venue.sport_type || "padel"]?.icon || "sports"}
            </span>
            {SPORT_LABELS[venue.sport_type || "padel"]?.label || "Olahraga"}
          </div>
          <div className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-on-surface shadow-sm">
            {venue.review_count} ulasan
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-headline font-bold text-lg">{venue.name}</h3>
          <div className="flex items-center text-primary font-bold">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className="ml-1 text-sm">{venue.rating_avg}</span>
          </div>
        </div>
        <p className="text-on-surface-variant text-sm mb-4">{venue.address}</p>
        <div className="flex gap-4 mb-6">
          {venue.facilities?.slice(0, 3).map((f) => (
            <div
              key={f}
              className="flex items-center gap-1.5 text-primary group/fac"
            >
              <span className="material-symbols-outlined text-lg font-bold group-hover/fac:scale-110 transition-transform">
                {facilityIcons[f] || "star"}
              </span>
              <span className="text-xs font-label uppercase group-hover/fac:text-primary transition-colors">
                {f}
              </span>
            </div>
          ))}
        </div>
        <Link href={`/venues/${venue.slug || venue.id}`}>
          <button className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 active:brightness-90 transition-all flex justify-center items-center gap-2 group/btn cursor-pointer shadow-lg shadow-primary/25 btn-3d">
            Booking Sekarang{" "}
            <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1.5 transition-transform">
              arrow_forward
            </span>
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function ExploreContent() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [useLocation, setUseLocation] = useState(false);
  const [sportFilter, setSportFilter] = useState("");
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetExpandedRef = useRef(false);
  const dragRef = useRef({
    active: false,
    startY: 0,
    startPos: 0,
    collapsedPx: 0,
  });

  const getCollapsedPx = () => window.innerHeight * 0.7 - 165;

  const handlePointerDown = (e: React.PointerEvent) => {
    const el = sheetRef.current;
    if (!el) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const collapsedPx = getCollapsedPx();
    const match = el.style.transform.match(/translateY\(([-\d.]+)/);
    const currentY = match
      ? parseFloat(match[1])
      : sheetExpandedRef.current
        ? 0
        : collapsedPx;
    dragRef.current = {
      active: true,
      startY: e.clientY,
      startPos: isNaN(currentY) ? 0 : currentY,
      collapsedPx,
    };
    el.style.transition = "none";
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const el = sheetRef.current;
    if (!el) return;
    const delta = e.clientY - dragRef.current.startY;
    const newPos = dragRef.current.startPos + delta;
    const clamped = Math.max(0, Math.min(dragRef.current.collapsedPx, newPos));
    el.style.transform = `translateY(${clamped}px)`;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = "";
    const match = el.style.transform.match(/translateY\(([-\d.]+)/);
    if (!match) return;
    const currentY = parseFloat(match[1]);
    if (isNaN(currentY)) return;
    const collapsedPx = dragRef.current.collapsedPx;
    const delta = Math.abs(e.clientY - dragRef.current.startY);
    let snapExpanded: boolean;
    if (delta < 5) {
      snapExpanded = !sheetExpandedRef.current;
    } else {
      snapExpanded = currentY < collapsedPx * 0.3;
    }
    sheetExpandedRef.current = snapExpanded;
    setSheetExpanded(snapExpanded);
    el.style.transform = snapExpanded
      ? "translateY(0px)"
      : `translateY(${collapsedPx}px)`;
  };

  // Keep ref in sync with state
  useEffect(() => {
    sheetExpandedRef.current = sheetExpanded;
  }, [sheetExpanded]);

  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (useLocation && navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>(
              (resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: false,
                  timeout: 15000,
                });
              },
            );
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setUserLocation([lat, lng]);
            params.set("lat", lat.toString());
            params.set("lng", lng.toString());
          } catch {
            if (!userLocation) {
              setUserLocation([-6.9932, 110.4203]);
            }
          }
        }
        if (sportFilter) {
          params.set("sport", sportFilter);
        }
        const url = `/api/venues${params.toString() ? `?${params.toString()}` : ""}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setVenues(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch venues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [useLocation, sportFilter]);

  const filteredVenues = useMemo(() => {
    if (!searchQuery.trim()) return venues;
    const q = searchQuery.toLowerCase();
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) || v.address.toLowerCase().includes(q),
    );
  }, [venues, searchQuery]);

  const mapVenues = useMemo(
    () =>
      filteredVenues.map((v) => ({
        id: v.id,
        slug: v.slug,
        name: v.name,
        address: v.address,
        latitude: v.latitude,
        longitude: v.longitude,
        rating: v.rating_avg,
        distance_km: v.distance_km,
      })),
    [filteredVenues],
  );

  /* ─── Shared filter content ─── */
  const filterContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-headline font-extrabold tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            maps_home_work
          </span>
          Venue di Semarang
        </h1>
        <span className="text-xs font-label uppercase tracking-widest text-outline">
          {filteredVenues.length} Tersedia
        </span>
      </div>

      <div className="flex items-center gap-2 bg-surface-container rounded-xl px-4 py-2.5 focus-glow">
        <span className="material-symbols-outlined text-outline text-lg">
          search
        </span>
        <input
          className="bg-transparent border-none focus:ring-0 w-full text-sm text-on-surface font-medium placeholder:text-outline/60 outline-none"
          placeholder="Cari venue atau area..."
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {SPORT_FILTERS.map((sport) => (
          <button
            key={sport.value}
            onClick={() => setSportFilter(sport.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 cursor-pointer min-h-[44px] ${
              sportFilter === sport.value
                ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-variant"
            }`}
          >
            <span
              className="material-symbols-outlined text-sm"
              style={
                sportFilter === sport.value
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {sport.icon}
            </span>
            {sport.label}
          </button>
        ))}
        <button
          onClick={() => setUseLocation(!useLocation)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 cursor-pointer min-h-[44px] ${
            useLocation
              ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-variant"
          }`}
        >
          <span
            className={`material-symbols-outlined text-sm transition-all duration-700 ${useLocation ? "rotate-0" : "rotate-0"}`}
            style={
              useLocation ? { fontVariationSettings: "'FILL' 1" } : undefined
            }
          >
            near_me
          </span>
          Terdekat
        </button>
      </div>
    </div>
  );

  /* ─── Shared venue list ─── */
  const venueListContent = loading ? (
    Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-2xl overflow-hidden">
        <div className="h-44 skeleton-enhanced" />
        <div className="p-5 space-y-3 bg-surface-container-lowest">
          <div className="h-5 skeleton-enhanced rounded w-3/4" />
          <div className="h-4 skeleton-enhanced rounded w-1/2" />
          <div className="h-10 skeleton-enhanced rounded" />
        </div>
      </div>
    ))
  ) : filteredVenues.length === 0 ? (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <span className="material-symbols-outlined text-5xl text-outline mb-4">
        search_off
      </span>
      <h3 className="font-bold text-lg mb-2">Tidak ada venue ditemukan</h3>
      <p className="text-on-surface-variant text-sm">
        Coba ubah kata kunci pencarian atau filter olahraga
      </p>
    </div>
  ) : (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className="space-y-4"
    >
      {filteredVenues.map((venue, index) => (
        <motion.div
          key={venue.id}
          variants={{
            hidden: { opacity: 0, y: 24 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                type: "spring" as const,
                stiffness: 200,
                damping: 20,
              },
            },
          }}
        >
          <VenueCard
            venue={venue}
            index={index}
            isSelected={selectedVenueId === venue.id}
            onSelect={() => setSelectedVenueId(venue.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  );

  return (
    <div className="bg-surface font-body text-on-surface flex flex-col min-h-screen overflow-x-hidden relative">
      {/* Kinetic Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="kinetic-bubble w-64 h-64 top-20 -left-20 opacity-40" />
        <div
          className="kinetic-bubble w-96 h-96 bottom-40 -right-20 opacity-30"
          style={{ animationDuration: "25s", animationDelay: "-5s" }}
        />
      </div>

      <Navbar activePage="explore" />

      {/* Main Content */}
      <main className="flex-grow flex md:flex-row h-[calc(100vh-72px)] overflow-hidden relative z-10 mt-[72px]">
        {/* ─── Desktop Sidebar ─── */}
        <aside className="hidden md:flex md:w-[420px] bg-surface/80 backdrop-blur-sm flex-col border-r border-outline-variant/15 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
            className="p-6 bg-surface-container-lowest shadow-sm"
          >
            {filterContent}
          </motion.div>
          {/* Gradient divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-4" />
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {venueListContent}
          </div>
        </aside>

        {/* ─── Map ─── */}
        <section className="relative flex-1 min-h-0">
          <VenueMap
            venues={mapVenues}
            externalUserLocation={userLocation}
            onMarkerClick={(id) => {
              window.location.href = `/venues/${mapVenues.find((v) => v.id === id)?.slug || id}`;
            }}
          />
        </section>
      </main>

      {/* ─── Mobile Bottom Sheet ─── */}
      <div
        ref={sheetRef}
        className={`md:hidden fixed bottom-0 left-0 right-0 z-30
                     bg-surface/95 backdrop-blur-xl rounded-t-3xl shadow-2xl
                     flex flex-col overflow-hidden
                     transition-transform duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]`}
        style={{
          height: "70vh",
          transform: sheetExpanded
            ? "translateY(0)"
            : "translateY(calc(70vh - 165px))",
        }}
      >
        {/* Drag Handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex-shrink-0 flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
          role="button"
          tabIndex={0}
          aria-label={
            sheetExpanded ? "Tutup daftar venue" : "Buka daftar venue"
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              setSheetExpanded(!sheetExpanded);
          }}
        >
          <div className="w-10 h-1.5 bg-outline/30 rounded-full hover:bg-outline/50 transition-colors" />
        </div>

        {/* Filter Section (always visible) */}
        <div className="flex-shrink-0 px-5 pb-3 pt-1 bg-surface/95 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] relative z-10">
          {filterContent}
        </div>

        {/* Edge fade gradient */}
        <div className="flex-shrink-0 relative z-20 h-4 -mt-4 bg-gradient-to-b from-surface/95 to-transparent pointer-events-none" />

        {/* Venue List (scrollable, only when expanded) */}
        {sheetExpanded && (
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 space-y-4">
            {venueListContent}
          </div>
        )}
      </div>

      <Footer variant="minimal" />
    </div>
  );
}
