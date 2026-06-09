import type { Metadata } from "next";
import CheckoutContent from "./CheckoutContent";

export const metadata: Metadata = {
  title: "Checkout - SportTime Semarang",
  description:
    "Selesaikan pembayaran booking lapangan olahraga Anda. Pilih metode pembayaran yang tersedia: QRIS, Virtual Account, atau E-Wallet.",
};

export default function CheckoutPage() {
  return <CheckoutContent />;
}
