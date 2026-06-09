"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Venue {
  id: string;
  slug: string;
  name: string;
  address: string;
  rating_avg: number;
  sport_type?: string;
  image_urls: string[];
}

const SPORT_LABELS: Record<string, { label: string; icon: string }> = {
  padel: { label: "Padel", icon: "sports_tennis" },
  futsal: { label: "Futsal", icon: "sports_soccer" },
  basket: { label: "Basket", icon: "sports_basketball" },
  badminton: { label: "Badminton", icon: "sports_tennis" },
  tennis: { label: "Tennis", icon: "sports_tennis" },
  voli: { label: "Voli", icon: "sports_volleyball" },
  other: { label: "Olahraga", icon: "sports" },
};

const SPORT_FILTERS: { value: string; label: string; icon: string }[] = [
  { value: "", label: "Semua", icon: "apps" },
  { value: "padel", label: "Padel", icon: "sports_tennis" },
  { value: "futsal", label: "Futsal", icon: "sports_soccer" },
  { value: "basket", label: "Basket", icon: "sports_basketball" },
  { value: "badminton", label: "Badminton", icon: "sports_tennis" },
  { value: "tennis", label: "Tennis", icon: "sports_tennis" },
  { value: "voli", label: "Voli", icon: "sports_volleyball" },
];

function getSportInfo(sportType?: string) {
  return SPORT_LABELS[sportType || "other"] || SPORT_LABELS.other;
}

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

function VenueCard({ venue, index }: { venue: Venue; index: number }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link
        href={`/venues/${venue.slug}`}
        id={venue.id}
        className="group bg-white/60 backdrop-blur-md rounded-[2rem] overflow-hidden border border-white/40 shadow-sm hover:shadow-2xl transition-all duration-500 tilt-card h-full block cursor-pointer"
      >
        <div className="relative h-64 overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            alt={venue.name}
            src={(venue.image_urls && venue.image_urls.length > 0) ? venue.image_urls[0] : "https://lh3.googleusercontent.com/aida-public/AB6AXuBrjBmuqUbFEIHf-tWIuAQLGY56Dcvog6Lh8uOcP_mWrY6lPPjiqQhj1IO0_k6HeqbfPoPwFNUZ_fty_U2nkZniGxLRCqydsWp5LRzcphY-UVBa-0X-hHgFo7AP2UScb4Kd5lwL-Qi5OTakTwWvFP4bVavayVMizrKztSJr8h-4SoVi2AmqZVeJl4TaTYHEtmM6RclVA33McQWudFEY6S2LoiNzKASu71Lsv3zGL6e8ut2WB6ICCnOcGvarc2Ky-evQWp8K9RBfZoHY"}
          />
          <div className="absolute top-4 right-4 glass-panel px-4 py-2 rounded-full flex items-center gap-1 border border-white/20">
            <span
              className="material-symbols-outlined text-primary text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className="text-on-surface font-bold text-sm">
              {venue.rating_avg.toFixed(1)}
            </span>
          </div>
          <div className="absolute top-4 left-4 glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
            <span className="material-symbols-outlined text-primary text-sm">
              {getSportInfo(venue.sport_type).icon}
            </span>
            <span className="text-on-surface font-bold text-xs">
              {getSportInfo(venue.sport_type).label}
            </span>
          </div>
        </div>

        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold mb-1">{venue.name}</h3>
              <p className="text-on-surface-variant text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  location_on
                </span>
                {venue.address}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-outline font-bold uppercase tracking-wider">
                MULAI DARI
              </p>
              <p className="text-xl font-black text-primary">
                Rp 80.000
                <span className="text-sm font-medium text-on-surface-variant">
                  /jam
                </span>
              </p>
            </div>
            <button className="w-12 h-12 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors btn-3d cursor-pointer">
              <span className="material-symbols-outlined">calendar_today</span>
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FeaturedVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState("");

  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      try {
        const url = activeSport
          ? `/api/venues?sport=${activeSport}`
          : "/api/venues";
        const res = await fetch(url);
        const json = await res.json();
        if (json.success && json.data) {
          setVenues(json.data.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to fetch venues", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, [activeSport]);

  return (
    <section
      id="featured-venues"
      className="py-24 bg-surface-container-low/30 overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="container mx-auto px-6 flex justify-between items-end mb-8"
      >
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-4">
            Venue <span className="text-primary-dim">Terpopuler</span>
          </h2>
          <p className="text-on-surface-variant text-lg">
            Pilihan venue olahraga terbaik dengan standar internasional.
          </p>
        </div>
        <Link href="/explore">
          <button
            id="view-all-venues-btn"
            className="hidden md:flex items-center gap-2 font-bold text-primary hover:gap-4 transition-all cursor-pointer"
          >
            Lihat Semua Venue{" "}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </Link>
      </motion.div>

      {/* Sport Filter Chips */}
      <div className="container mx-auto px-6 mb-8">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {SPORT_FILTERS.map((sport) => (
            <button
              key={sport.value}
              onClick={() => setActiveSport(sport.value)}
              className={`flex items-center gap-1.5 px-5 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 cursor-pointer min-h-[44px] ${
                activeSport === sport.value
                  ? "bg-primary text-primary-fixed shadow-lg shadow-primary/30 scale-105"
                  : "bg-white/60 backdrop-blur-md border border-white/40 text-on-surface-variant hover:bg-white/80 hover:shadow-md"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {sport.icon}
              </span>
              {sport.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-6 grid md:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="h-96 skeleton-enhanced rounded-[2rem]" />
          ))
        ) : venues.length > 0 ? (
          venues.map((venue, index) => (
            <VenueCard key={venue.id} venue={venue} index={index} />
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <span className="material-symbols-outlined text-6xl text-outline-variant mb-4 block">
              sports
            </span>
            <p className="text-on-surface-variant text-lg">
              Belum ada venue untuk olahraga ini.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}