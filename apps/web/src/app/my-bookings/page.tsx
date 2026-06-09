import type { Metadata } from "next";
import MyBookingsContent from "./MyBookingsContent";

export const metadata: Metadata = {
  title: "My Bookings - SportTime Semarang",
  description:
    "Kelola semua booking lapangan olahraga Anda di Semarang. Lihat jadwal, riwayat, dan status booking.",
};

export default function MyBookingsPage() {
  return <MyBookingsContent />;
}
