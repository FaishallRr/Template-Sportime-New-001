import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrustBadges from "@/components/TrustBadges";
import HowItWorks from "@/components/HowItWorks";
import FeaturedVenues from "@/components/FeaturedVenues";
import Testimonials from "@/components/Testimonials";
import SeoContent from "@/components/SeoContent";
import Footer from "@/components/Footer";
import FloatingActionButton from "@/components/FloatingActionButton";
import RoleRedirector from "@/components/RoleRedirector";

const SITE_URL = "https://sporttime.id";
const SITE_NAME = "SportTime Semarang";
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title:
    "SportTime Semarang: Sewa Lapangan Padel, Futsal, Basket & Badminton | Booking Online 24 Jam",
  description:
    "Booking lapangan olahraga di Semarang online 24 jam. Pilih Padel, Futsal, Basket, Badminton, Voli — jadwal real-time, harga transparan, bayar QRIS. #1 platform sewa lapangan di Semarang.",
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
    "booking lapangan online",
    "sporttime",
    "futsal semarang",
    "sewa lapangan murah semarang",
    "jadwal lapangan semarang",
    "court booking semarang",
  ],
  authors: [{ name: "SportTime" }],
  creator: "SportTime",
  publisher: "SportTime",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    languages: { "id-ID": "/" },
  },
  openGraph: {
    title: "SportTime Semarang — Sewa Lapangan Olahraga Online",
    description:
      "Booking Padel, Futsal, Basket, Badminton & Voli di Semarang. Jadwal real-time, harga transparan, bayar instan.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "SportTime — Sewa Lapangan Olahraga di Semarang",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SportTime Semarang — Sewa Lapangan Olahraga Online",
    description:
      "Booking Padel, Futsal, Basket, Badminton & Voli di Semarang. Jadwal real-time, harga transparan.",
    images: [OG_IMAGE],
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
  category: "sports",
};

export default function Home() {
  const jsonLdLocalBusiness = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: "SportTime Semarang",
    description:
      "Platform booking lapangan olahraga terdepan di Semarang. Padel, Futsal, Basket, Badminton, Voli — semua di satu tempat.",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: OG_IMAGE,
    telephone: "+628123456789",
    priceRange: "Rp80.000 - Rp350.000/jam",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Semarang",
      addressRegion: "Jawa Tengah",
      addressCountry: "ID",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -6.9666,
      longitude: 110.4196,
    },
    areaServed: {
      "@type": "City",
      name: "Semarang",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "06:00",
      closes: "23:00",
    },
    sameAs: [
      "https://instagram.com/sporttime.id",
      "https://tiktok.com/@sporttime.id",
    ],
  };

  const jsonLdWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/explore?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const jsonLdFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Bagaimana cara booking lapangan olahraga di Semarang melalui SportTime?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Buka sporttime.id, pilih jenis olahraga (Padel, Futsal, Basket, Badminton, atau Voli), pilih venue dan jadwal yang tersedia, lalu lakukan pembayaran via QRIS atau transfer. Konfirmasi instan langsung ke WhatsApp.",
        },
      },
      {
        "@type": "Question",
        name: "Berapa harga sewa lapangan di Semarang?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Harga sewa lapangan olahraga di Semarang mulai dari Rp80.000/jam untuk badminton, Rp120.000/jam untuk futsal, Rp150.000/jam untuk padel, hingga Rp300.000/jam untuk basket full court. Harga sudah termasuk fasilitas lengkap.",
        },
      },
      {
        "@type": "Question",
        name: "Apa saja olahraga yang bisa dibooking di SportTime?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SportTime menyediakan booking untuk 6 jenis olahraga: Padel (lapangan kaca indoor/outdoor), Futsal (indoor vinyl), Basket (indoor kayu FIBA), Badminton (6 court), Tennis (clay/grass), dan Voli indoor.",
        },
      },
      {
        "@type": "Question",
        name: "Apakah bisa bayar langsung di tempat tanpa booking online?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Booking online melalui SportTime menjamin jadwal Anda tersedia. Walk-in tanpa booking berisiko lapangan sudah dipakai. Dengan booking online, Anda mendapat konfirmasi instan, kode akses, dan struk digital.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdLocalBusiness),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdWebSite),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
      />
      <RoleRedirector />
      <Navbar />
      <main>
        <HeroSection />
        <TrustBadges />
        <HowItWorks />
        <FeaturedVenues />
        <SeoContent />
        <Testimonials />
      </main>
      <Footer />
      <FloatingActionButton />
    </>
  );
}
