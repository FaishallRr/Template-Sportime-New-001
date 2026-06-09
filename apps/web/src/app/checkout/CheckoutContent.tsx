"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutData {
  venueId: string;
  venueName: string;
  slotId: string;
  courtName: string;
  date: string;
  time: string;
  price: number;
}

interface PaymentChannel {
  code: string;
  name: string;
  group: "QRIS" | "VA" | "CVS";
  color: string;
  textColor: string;
  logoSrc: string;
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const channels: PaymentChannel[] = [
  { code: "QRIS", name: "QRIS", group: "QRIS", color: "#006B5E", textColor: "#fff", logoSrc: "/images/payment/qris.svg" },
  { code: "BCA", name: "BCA Virtual Account", group: "VA", color: "#003da5", textColor: "#fff", logoSrc: "/images/payment/bca.svg" },
  { code: "MANDIRI", name: "Mandiri Bill Payment", group: "VA", color: "#e51937", textColor: "#fff", logoSrc: "/images/payment/mandiri.svg" },
  { code: "BRI", name: "BRI Virtual Account", group: "VA", color: "#084a8d", textColor: "#fff", logoSrc: "/images/payment/bri.svg" },
  { code: "BNI", name: "BNI Virtual Account", group: "VA", color: "#f58220", textColor: "#fff", logoSrc: "/images/payment/bni.svg" },
  { code: "BSI", name: "BSI Virtual Account", group: "VA", color: "#0f8555", textColor: "#fff", logoSrc: "/images/payment/bsi.svg" },
  { code: "PERMATA", name: "Permata Virtual Account", group: "VA", color: "#003c71", textColor: "#fff", logoSrc: "/images/payment/permata.svg" },
  { code: "ALFAMART", name: "Alfamart", group: "CVS", color: "#EE1B24", textColor: "#fff", logoSrc: "/images/payment/alfamart.svg" },
  { code: "INDOMARET", name: "Indomaret", group: "CVS", color: "#0058A9", textColor: "#fff", logoSrc: "/images/payment/indomaret.svg" },
  { code: "ALFAMIDI", name: "Alfamidi", group: "CVS", color: "#00843D", textColor: "#fff", logoSrc: "/images/payment/alfamidi.svg" },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 70, damping: 14 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 12 } },
};

const groupLabels: Record<string, string> = {
  QRIS: "QRIS",
  VA: "Virtual Account",
  CVS: "Convenience Store",
};

const groupOrder = ["QRIS", "VA", "CVS"];

function PaymentLogo({ channel, selected }: { channel: PaymentChannel; selected: boolean }) {
  const [error, setError] = useState(false);
  const src = selected ? channel.logoSrc.replace('.svg', '-white.svg') : channel.logoSrc;

  if (error) {
    const firstLetter = channel.name.charAt(0);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="60" height="60" rx="8" fill="${channel.color.slice(1)}"/><text x="30" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="#fff">${firstLetter}</text></svg>`;
    return <img src={`data:image/svg+xml,${encodeURIComponent(svg)}`} alt={channel.name} className="h-7 w-auto object-contain pointer-events-none select-none" />;
  }

  return (
    <img
      src={src}
      alt={channel.name}
      className="h-7 w-auto object-contain pointer-events-none select-none"
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

function SummaryLogo({ channel }: { channel: PaymentChannel }) {
  const [error, setError] = useState(false);
  const src = channel.logoSrc.replace('.svg', '-white.svg');

  if (error) {
    const firstLetter = channel.name.charAt(0);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="60" height="60" rx="8" fill="${channel.color.slice(1)}"/><text x="30" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="#fff">${firstLetter}</text></svg>`;
    return <img src={`data:image/svg+xml,${encodeURIComponent(svg)}`} alt={channel.name} className="h-5 w-auto object-contain" />;
  }

  return (
    <img
      src={src}
      alt={channel.name}
      className="h-5 w-auto object-contain"
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

export default function CheckoutContent() {
  const router = useRouter();
  const [data, setData] = useState<CheckoutData | null>(null);
  const [paymentCode, setPaymentCode] = useState<string>("");
  const [agreed, setAgreed] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("checkoutData");
    if (stored) {
      const parsed: CheckoutData = JSON.parse(stored);
      setData(parsed);
    } else {
      router.push("/");
    }
  }, [router]);

  const handlePayNow = async () => {
    if (!agreed) {
      setErrorMsg("Anda harus menyetujui Syarat & Ketentuan terlebih dahulu.");
      return;
    }
    if (!data) return;
    if (!paymentCode) {
      setErrorMsg("Pilih metode pembayaran terlebih dahulu.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const token = document.cookie.split("; ").find((row) => row.startsWith("access_token="))?.split("=")[1];
      if (!token) {
        router.push("/login?redirect=/checkout");
        return;
      }

      const idempotencyKey = `idemp-${data.slotId}-${Date.now()}`;

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slot_id: data.slotId,
          idempotency_key: idempotencyKey,
          promo_code: promoCode,
          payment_method: paymentCode,
        }),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        setErrorMsg(resData.error || "Gagal memproses booking. Coba lagi.");
        setLoading(false);
        return;
      }

      const checkoutUrl = resData.data?.checkout_url || resData.data?.tripay?.checkout_url;
      if (!checkoutUrl) {
        setErrorMsg("Link pembayaran tidak tersedia. Silakan coba lagi atau hubungi admin.");
        setLoading(false);
        return;
      }
      sessionStorage.setItem("payment_data", JSON.stringify({
        method: resData.data?.tripay?.payment_method,
        payment_name: resData.data?.tripay?.payment_name,
        pay_code: resData.data?.tripay?.pay_code,
        qr_url: resData.data?.tripay?.qr_url,
        qr_string: resData.data?.tripay?.qr_string,
        checkout_url: checkoutUrl,
        reference: resData.data?.tripay?.reference,
        total_amount: resData.data?.amount,
      }));
      router.push(`/booking-confirmation?id=${resData.data.booking_id}`);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan saat memproses pembayaran.");
      setLoading(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Masukkan kode promo");
      return;
    }

    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.toUpperCase(), amount: data?.price || 0 }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        setDiscount(json.data.discount_amount);
        toast.success("Kode promo berhasil diterapkan!");
      } else {
        setDiscount(0);
        toast.error(json.error || "Kode promo tidak valid");
      }
    } catch {
      setDiscount(0);
      toast.error("Gagal validasi kode promo");
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="material-symbols-outlined text-4xl text-primary"
        >
          progress_activity
        </motion.span>
      </div>
    );
  }

  const netPrice = data.price - discount;
  const serviceFee = Math.floor(netPrice * 0.05);
  const totalAmount = netPrice + serviceFee;
  const displayTime = data.time
    .split(" - ")
    .map((t) => (t.match(/(\d{2}:\d{2})/) || [t])[0])
    .join(" - ");

  const selectedChannel = channels.find((c) => c.code === paymentCode);
  const groupedChannels = groupOrder.map((group) => ({
    group,
    label: groupLabels[group],
    items: channels.filter((c) => c.group === group),
  }));

  return (
    <div className="bg-surface text-on-background min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 lg:py-16 mt-16">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1.5 group"
          >
            <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">
              arrow_back
            </span>
            Kembali
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 space-y-6"
          >
            {/* Error Banner */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  key="error-banner"
                  initial={{ opacity: 0, y: -16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.96 }}
                  transition={{ type: "spring" as const, stiffness: 200, damping: 18 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-start gap-3 shadow-sm"
                >
                  <span className="material-symbols-outlined shrink-0 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    error
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Gagal memproses</p>
                    <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
                  </div>
                  <button
                    onClick={() => setErrorMsg("")}
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Payment Methods */}
            <motion.section
              variants={sectionVariants}
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      payments
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900">
                      Metode Pembayaran
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Pilih metode pembayaran yang tersedia</p>
                  </div>
                </div>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="hidden sm:flex items-center gap-1.5 text-[10px] md:text-xs uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    lock
                  </span>
                  Aman
                </motion.span>
              </div>

              <div className="space-y-8">
                {groupedChannels.map((g) => (
                  <div key={g.group}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        {g.label}
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent" />
                    </div>
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                    >
                      {g.items.map((ch) => (
                        <motion.button
                          key={ch.code}
                          variants={cardVariants}
                          whileHover={{ y: -5, boxShadow: "0 12px 28px -8px rgba(0,0,0,0.15)" }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setPaymentCode(ch.code)}
                          className={`relative rounded-2xl p-4 text-center cursor-pointer transition-all border-2 flex flex-col items-center gap-3 min-h-[110px] ${
                            paymentCode === ch.code
                              ? "bg-white"
                              : "bg-white hover:bg-slate-50/80"
                          }`}
                          style={
                            paymentCode === ch.code
                              ? {
                                  borderColor: ch.color,
                                  boxShadow: `0 0 0 3px ${ch.color}20, 0 8px 24px -6px ${ch.color}30`,
                                }
                              : { borderColor: "#f1f5f9" }
                          }
                        >
                          {/* Logo area */}
                          <div
                            className={`w-full py-3.5 rounded-xl flex items-center justify-center transition-all duration-300`}
                            style={{
                              backgroundColor: paymentCode === ch.code ? ch.color : "#f8fafc",
                            }}
                          >
                            <PaymentLogo channel={ch} selected={paymentCode === ch.code} />
                          </div>

                          {/* Name */}
                          <span
                            className={`text-xs font-bold leading-tight ${
                              paymentCode === ch.code ? "text-slate-900" : "text-slate-500"
                            }`}
                          >
                            {ch.name}
                          </span>

                          {/* Selected check badge */}
                          {paymentCode === ch.code && (
                            <motion.div
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring" as const, stiffness: 300, damping: 14 }}
                              className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                              style={{ backgroundColor: ch.color }}
                            >
                              <span
                                className="material-symbols-outlined text-white text-[13px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                check
                              </span>
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>
                ))}
              </div>

              {/* Helper text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-5 text-[11px] text-slate-400 text-center flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">info</span>
                Pembayaran diproses secara aman oleh Tripay
              </motion.p>
            </motion.section>

            {/* Promo Code */}
            <motion.section
              variants={sectionVariants}
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    redeem
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Punya Kode Promo?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Masukkan kode promo untuk mendapatkan diskon</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    sell
                  </span>
                  <input
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                    placeholder="Masukkan kode promo"
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleApplyPromo}
                  className="px-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                >
                  Pakai
                </motion.button>
              </div>
              <AnimatePresence>
                {discount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ type: "spring" as const, stiffness: 150, damping: 16 }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                      <div>
                        <p className="text-emerald-700 text-sm font-bold">
                          Promo berhasil diterapkan!
                        </p>
                        <p className="text-emerald-600 text-xs mt-0.5">
                          Diskon {formatRupiah(discount)} telah diterapkan
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* Terms & Conditions */}
            <motion.div
              variants={sectionVariants}
              className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm"
            >
              <label
                className="flex items-start gap-3 cursor-pointer select-none"
                htmlFor="terms"
              >
                <div className="relative mt-0.5 shrink-0">
                  <input
                    className="peer sr-only"
                    id="terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                      agreed
                        ? "bg-primary border-primary"
                        : "bg-white border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {agreed && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring" as const, stiffness: 300 }}
                        className="material-symbols-outlined text-white text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check
                      </motion.span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-600 leading-relaxed">
                  Saya menyetujui{" "}
                  <a className="text-primary font-bold hover:underline" href="#">
                    Syarat & Ketentuan Layanan
                  </a>{" "}
                  serta{" "}
                  <a className="text-primary font-bold hover:underline" href="#">
                    Kebijakan Pembatalan
                  </a>
                  . Pesanan tidak dapat dibatalkan dalam kurun 24 jam sebelum jadwal.
                </span>
              </label>
            </motion.div>
          </motion.div>

          {/* Right Column — Summary */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="lg:col-span-5"
          >
            <div className="sticky top-28 space-y-6">
              {/* Main Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden ring-1 ring-slate-700/50">
                {/* Glow orbs */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.18, 0.1] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  className="absolute -top-20 -right-20 w-56 h-56 bg-primary rounded-full blur-[100px] pointer-events-none"
                />
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.12, 0.06] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-500 rounded-full blur-[80px] pointer-events-none"
                />

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      receipt_long
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-white">
                      Detail Pesanan
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">
                      Ringkasan booking
                    </p>
                  </div>
                </div>

                {/* Detail Items */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4 mb-6"
                >
                  {[
                    { icon: "sports_tennis", label: "Tempat", value: data.venueName, sub: data.courtName },
                    {
                      icon: "calendar_today",
                      label: "Tanggal",
                      value: new Date(data.date).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }),
                    },
                    { icon: "schedule", label: "Jam", value: displayTime },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      variants={cardVariants}
                      className="flex items-start gap-3.5"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-base">{item.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5 font-bold">
                          {item.label}
                        </p>
                        <p className="font-bold text-white truncate text-sm">{item.value}</p>
                        {item.sub && (
                          <p className="text-xs text-primary/90 mt-0.5 font-medium">{item.sub}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Price Breakdown */}
                <div className="pt-5 border-t border-white/10 space-y-3">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-slate-400">Sewa Lapangan</span>
                    <span className="font-semibold text-white">{formatRupiah(data.price)}</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-slate-400">Biaya Layanan (5%)</span>
                    <span className="font-semibold text-white">{formatRupiah(serviceFee)}</span>
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {discount > 0 && (
                      <motion.div
                        key="discount-row"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring" as const, stiffness: 150, damping: 16 }}
                        className="flex justify-between items-center text-sm overflow-hidden"
                      >
                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">discount</span>
                          Diskon Promo
                        </span>
                        <span className="font-semibold text-emerald-400">-{formatRupiah(discount)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="flex justify-between items-center pt-3 border-t border-white/10"
                  >
                    <span className="text-base font-bold text-white">Total Tagihan</span>
                    <motion.span
                      key={totalAmount}
                      initial={{ opacity: 0, y: -8, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring" as const, stiffness: 200, damping: 14 }}
                      className="text-xl font-black text-primary"
                    >
                      {formatRupiah(totalAmount)}
                    </motion.span>
                  </motion.div>
                </div>

                {/* Selected Payment Indicator */}
                {selectedChannel ? (
                  <motion.div
                    key={selectedChannel.code}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring" as const, stiffness: 200, damping: 16 }}
                    className="mt-5 p-3.5 rounded-xl flex items-center gap-3"
                    style={{ backgroundColor: `${selectedChannel.color}15`, border: `1px solid ${selectedChannel.color}30` }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: selectedChannel.color }}
                    >
                      <SummaryLogo channel={selectedChannel} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{selectedChannel.name}</p>
                      <p className="text-[10px] font-medium" style={{ color: `${selectedChannel.color}cc` }}>
                        Metode pembayaran dipilih
                      </p>
                    </div>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" as const, stiffness: 300 }}
                      className="ml-auto shrink-0 p-1 rounded-full"
                      style={{ backgroundColor: `${selectedChannel.color}40` }}
                    >
                      <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check
                      </span>
                    </motion.span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-5 p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-slate-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        credit_card
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Belum ada metode pembayaran dipilih
                    </p>
                  </motion.div>
                )}

                {/* Payment Deadline */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 p-3.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3"
                >
                  <motion.span
                    animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="material-symbols-outlined text-amber-400 text-lg shrink-0"
                  >
                    timer
                  </motion.span>
                  <div>
                    <p className="text-xs font-bold text-white">Batas Pembayaran</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Selesaikan pembayaran dalam 24 jam untuk konfirmasi booking otomatis
                    </p>
                  </div>
                </motion.div>

                {/* CTA Button */}
                <motion.button
                  whileHover={agreed && !!paymentCode ? { scale: 1.015 } : {}}
                  whileTap={agreed && !!paymentCode ? { scale: 0.985 } : {}}
                  onClick={handlePayNow}
                  disabled={loading || !agreed || !paymentCode}
                  className="w-full mt-5 bg-primary hover:bg-primary/90 text-on-primary py-4 rounded-2xl text-base font-black tracking-tight transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden shadow-[0_8px_30px_rgb(202,253,0,0.25)] hover:shadow-[0_12px_40px_rgb(202,253,0,0.35)] disabled:shadow-none"
                >
                  {loading ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="material-symbols-outlined text-2xl"
                    >
                      sync
                    </motion.span>
                  ) : (
                    <>
                      Bayar Sekarang
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </>
                  )}
                  {!loading && (
                    <motion.div
                      animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0.05, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      className="absolute inset-0 bg-white/10 rounded-2xl pointer-events-none"
                    />
                  )}
                </motion.button>

                {/* Payment Method Icons */}
                <div className="mt-5 flex items-center justify-center gap-4 opacity-25">
                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs">credit_card</span>
                  </div>
                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs">account_balance</span>
                  </div>
                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs">qr_code_2</span>
                  </div>
                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs">smartphone</span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-start gap-3 px-5 py-4 bg-gradient-to-r from-emerald-50/90 to-emerald-50/70 rounded-2xl border border-emerald-100"
              >
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="material-symbols-outlined text-emerald-600 mt-0.5 shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified_user
                </motion.span>
                <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                  Transaksi Anda dijamin aman. SportTime tidak menyimpan data kartu atau PIN Anda.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
