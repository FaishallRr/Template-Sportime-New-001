import type { Metadata } from "next";
import ExploreContent from "./ExploreContent";

export const metadata: Metadata = {
  title: "Explore Venue Olahraga di Semarang — Padel, Futsal, Basket, Badminton",
  description:
    "Cari dan booking venue olahraga terbaik di Semarang. Peta interaktif, filter per olahraga, cek jadwal real-time. Padel, Futsal, Basket, Badminton, Voli.",
  openGraph: {
    title: "Explore Venue Olahraga di Semarang | SportTime",
    description:
      "Cari dan booking venue olahraga terbaik di Semarang. Peta interaktif, filter per olahraga, cek jadwal real-time.",
  },
};

export default function ExplorePage() {
  return <ExploreContent />;
}