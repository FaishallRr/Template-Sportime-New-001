import type { Metadata } from "next";
import ConfirmationContent from "./ConfirmationContent";

export const metadata: Metadata = {
  title: "Booking Confirmed! - SportTime Semarang",
  description:
    "Booking lapangan olahraga Anda telah dikonfirmasi. Lihat detail booking, kode QR, dan bagikan ke tim Anda.",
};

export default function BookingConfirmationPage() {
  return <ConfirmationContent />;
}
