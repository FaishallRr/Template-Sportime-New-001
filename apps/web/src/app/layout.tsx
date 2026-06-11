import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default:
      "SportTime Semarang — Sewa Lapangan Padel, Futsal, Basket & Badminton Online",
    template: "%s | SportTime Semarang",
  },
  description:
    "Booking lapangan olahraga di Semarang secara online 24 jam. Padel, Futsal, Basket, Badminton, Voli — jadwal real-time, harga transparan, bayar QRIS.",
  keywords: [
    "sewa lapangan semarang",
    "booking lapangan semarang",
    "sewa futsal semarang",
    "lapangan basket semarang",
    "badminton semarang",
    "padel semarang",
    "tennis semarang",
    "voli semarang",
    "lapangan olahraga semarang",
    "sporttime",
    "booking lapangan online",
    "jadwal lapangan semarang",
  ],
  authors: [{ name: "SportTime" }],
  creator: "SportTime",
  publisher: "SportTime",
  metadataBase: new URL("https://sporttime.id"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SportTime Semarang — Sewa Lapangan Olahraga Online",
    description:
      "Booking Padel, Futsal, Basket, Badminton & Voli di Semarang. Jadwal real-time, harga transparan, bayar instan.",
    type: "website",
    locale: "id_ID",
    siteName: "SportTime Semarang",
  },
  twitter: {
    card: "summary_large_image",
    title: "SportTime Semarang — Sewa Lapangan Olahraga Online",
    description: "Booking Padel, Futsal, Basket, Badminton & Voli di Semarang.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { Toaster } from "react-hot-toast";
import FloatingActionButton from "@/components/FloatingActionButton";
import PageTransitionWrapper from "@/components/PageTransitionWrapper";
import ScrollToTop from "@/components/ScrollToTop";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakarta.variable} antialiased`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-surface font-body text-on-surface overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-3 focus:bg-primary focus:text-on-primary focus:rounded-xl focus:font-bold focus:shadow-lg"
        >
          Langsung ke konten utama
        </a>
        <ScrollToTop />
        <div id="main-content">
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "16px",
              padding: "14px 18px",
              fontSize: "14px",
              fontWeight: 500,
            },
            success: {
              iconTheme: { primary: "#4e6300", secondary: "#e1ff88" },
            },
            error: {
              iconTheme: { primary: "#b02500", secondary: "#ffefec" },
            },
          }}
        />
        <FloatingActionButton />
      </body>
    </html>
  );
}
