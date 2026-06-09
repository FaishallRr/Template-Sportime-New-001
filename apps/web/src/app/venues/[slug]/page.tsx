import type { Metadata } from "next";
import VenueDetailContent from "./VenueDetailContent";

export const metadata: Metadata = {
  title: "Venue Details - SportTime Semarang",
  description:
    "Lihat detail venue, foto, jadwal, dan review. Booking lapangan olahraga terbaik di Semarang secara instan.",
};

export default function VenueDetailPage() {
  return <VenueDetailContent />;
}
