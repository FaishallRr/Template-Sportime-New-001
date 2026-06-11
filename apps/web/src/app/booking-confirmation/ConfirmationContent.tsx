"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RevealOnScroll from "@/components/RevealOnScroll";

function ConfirmationBody() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");
  const [booking, setBooking] = useState<any>(null);
  const [adminFee, setAdminFee] = useState(0);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const totalAmount = (booking?.gross_amount || 0) + adminFee;

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="))
      ?.split("=")[1];
    fetch(`/api/bookings/${bookingId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBooking(data.data.booking);
          setAdminFee(data.data.admin_fee || 0);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    const stored = sessionStorage.getItem("payment_data");
    if (stored) {
      try {
        setPaymentData(JSON.parse(stored));
      } catch {}
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="bg-surface font-body text-on-surface flex flex-col min-h-screen">
        <Navbar variant="confirmation" />
        <main className="flex-grow pt-24 pb-20 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Header skeleton */}
            <div className="text-center mb-10 space-y-4">
              <div className="w-20 h-20 rounded-full skeleton-pulse mx-auto" />
              <div className="h-10 w-64 skeleton-pulse rounded-xl mx-auto" />
              <div className="h-5 w-80 skeleton-pulse rounded-lg mx-auto" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left skeleton */}
              <div className="lg:col-span-7">
                <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/40">
                  <div className="h-32 skeleton-pulse" />
                  <div className="p-8 space-y-6">
                    <div className="flex gap-6">
                      <div className="w-24 h-24 rounded-2xl skeleton-pulse shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-6 w-48 skeleton-pulse rounded-lg" />
                        <div className="h-4 w-36 skeleton-pulse rounded-lg" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="h-14 skeleton-pulse rounded-xl" />
                      <div className="h-14 skeleton-pulse rounded-xl" />
                    </div>
                    <div className="h-40 skeleton-pulse rounded-2xl" />
                  </div>
                  <div className="h-20 skeleton-pulse" />
                </div>
              </div>
              {/* Right skeleton */}
              <div className="lg:col-span-5 space-y-6">
                <div className="h-48 skeleton-pulse rounded-3xl" />
                <div className="h-48 skeleton-pulse rounded-3xl" />
                <div className="h-32 skeleton-pulse rounded-3xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer variant="minimal" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-surface font-body text-on-surface flex flex-col min-h-screen">
        <Navbar variant="confirmation" />
        <main className="flex-grow pt-24 pb-20 px-4 md:px-8 flex items-center justify-center">
          <div className="glass-panel rounded-[2rem] border border-white/50 p-12 text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-surface-container-high/50 flex items-center justify-center mx-auto mb-6 floating-element">
              <span className="material-symbols-outlined text-4xl text-outline-variant">
                search_off
              </span>
            </div>
            <h1 className="text-2xl font-black text-on-surface mb-2">
              Booking tidak ditemukan
            </h1>
            <p className="text-on-surface-variant mb-6">
              ID booking tidak valid atau telah dihapus.
            </p>
            <Link href="/">
              <button className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold btn-3d cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
                <span className="material-symbols-outlined text-sm mr-1 align-middle">
                  home
                </span>
                Kembali ke Beranda
              </button>
            </Link>
          </div>
        </main>
        <Footer variant="minimal" />
      </div>
    );
  }

  const dateObj = new Date(booking.slot_date);
  const formattedDate = dateObj.toLocaleDateString("id-ID", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(paymentData?.total_amount || totalAmount || booking.gross_amount);

  const formattedBookingDate = new Date(booking.booked_at).toLocaleString(
    "id-ID",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div className="bg-surface font-body text-on-surface flex flex-col min-h-screen">
      <Navbar variant="confirmation" />

      <main className="flex-grow pt-24 pb-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* ── Success Header ── */}
          <RevealOnScroll>
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full hero-gradient mb-6 shadow-xl shadow-primary/20 floating-element">
                <span
                  className="material-symbols-outlined text-on-primary text-5xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter mb-2">
                Booking <span className="gradient-text">Berhasil!</span>
              </h1>
              <p className="text-on-surface-variant text-lg">
                Sampai jumpa di lapangan. Siapkan fisik terbaik Anda.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── Left: Digital E-Invoice Card ── */}
            <div className="lg:col-span-7">
              <RevealOnScroll delay={100}>
                <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/40 shadow-sm hover:shadow-xl transition-all duration-500 tilt-card relative group">
                  {/* Gradient border glow */}
                  <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                    <div className="absolute inset-[-2px] rounded-[2rem] bg-gradient-to-r from-primary-fixed/40 via-primary/20 to-primary-fixed/40 blur-sm" />
                    <div className="absolute inset-0 rounded-[2rem] bg-white/60 backdrop-blur-xl" />
                  </div>

                  {/* Invoice Watermark */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.015] pointer-events-none select-none rotate-[-30deg]">
                    <span className="text-[12rem] font-black italic tracking-tighter text-primary">
                      SPORTTIME
                    </span>
                  </div>

                  <div className="relative z-10">
                    {/* Top Section: Header */}
                    <div className="hero-gradient p-8 flex justify-between items-start">
                      <div>
                        <p className="text-xs font-label font-bold uppercase tracking-widest text-on-primary/70 mb-1">
                          Resi Elektronik
                        </p>
                        <h2 className="text-xl md:text-2xl font-headline font-extrabold tracking-tight text-white">
                          {booking.id.split("-")[0].toUpperCase()}
                        </h2>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-label font-bold uppercase tracking-widest text-on-primary/70 mb-1">
                          Status
                        </p>
                        {booking.status === "pending" ? (
                          <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-block">
                            Menunggu Pembayaran
                          </div>
                        ) : booking.status === "confirmed" || booking.status === "completed" ? (
                          <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-block">
                            Lunas
                          </div>
                        ) : (
                          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-block">
                            Dibatalkan
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-8 space-y-8">
                      {/* Court Highlight */}
                      <div className="flex gap-6 items-center group/court">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/30 shadow-sm group-hover/court:shadow-md transition-all duration-300 group-hover/court:scale-105">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className="w-full h-full object-cover group-hover/court:scale-110 transition-transform duration-500"
                            loading="lazy"
                            alt="Padel Court"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCN7Pkj1KMhUctmf03RJMKrFp5OjgfiPwTUzTmPI_gVVXNUlSRDLVeSkh0IfPcTBggFFWjGUccfcbuQqRMi6TBc5l4QdpZrC_Fcp8d0EJmGCu85U5_s3iCgVms86IfK4KOMVi4nts102BoivlsDQpntn7aL3MfWHI2nrET3bVJfk2RajbwoB4J_FUf-DlKGYqsnrgdQPnTwIKc5gTOcrP5aUhWo25wJ-RJ_EGTkpf1zL4wGyuOu2ZjP6eR4be_4At1_7PxjnZ1ZidY"
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-headline font-bold text-on-surface uppercase">
                            {booking.court_name}
                          </h3>
                          <p className="text-on-surface-variant font-medium flex items-center gap-2 mt-1">
                            <span className="material-symbols-outlined text-sm text-primary">
                              location_on
                            </span>
                            {booking.venue_name}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-container-low/50 rounded-xl p-4 group/detail hover:bg-surface-container-low hover:shadow-sm transition-all duration-300">
                          <p className="text-[10px] font-label font-bold uppercase tracking-widest text-outline mb-1">
                            Tanggal
                          </p>
                          <p className="font-bold text-base md:text-lg text-on-surface flex items-center gap-1.5 group-hover/detail:translate-x-0.5 transition-transform duration-300">
                            <span className="material-symbols-outlined text-sm text-primary">
                              calendar_today
                            </span>
                            {formattedDate}
                          </p>
                        </div>
                        <div className="bg-surface-container-low/50 rounded-xl p-4 group/detail hover:bg-surface-container-low hover:shadow-sm transition-all duration-300">
                          <p className="text-[10px] font-label font-bold uppercase tracking-widest text-outline mb-1">
                            Waktu Main
                          </p>
                          <p className="font-bold text-base md:text-lg text-on-surface flex items-center gap-1.5 group-hover/detail:translate-x-0.5 transition-transform duration-300">
                            <span className="material-symbols-outlined text-sm text-primary">
                              schedule
                            </span>
                            {booking.slot_time}
                          </p>
                        </div>
                      </div>

                      {/* QR Section */}
                      <div className="relative py-8 mt-4">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-fixed/40 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary-fixed/40 to-transparent" />

                        <div className="flex flex-col md:flex-row items-center gap-8">
                          <div className="p-4 glass-panel rounded-2xl border border-white/40 shadow-sm group/qr">
                            <div className="w-32 h-32 flex items-center justify-center rounded-lg relative overflow-hidden bg-white/40">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${booking.verification_code}`}
                                alt="QR Code"
                                loading="lazy"
                                className="w-full h-full object-contain group-hover/qr:scale-105 transition-transform duration-500"
                              />
                            </div>
                          </div>
                          <div className="flex-grow text-center md:text-left">
                            <p className="text-sm font-medium text-on-surface-variant mb-2">
                              Kode Verifikasi
                            </p>
                            <p className="text-3xl font-black font-headline tracking-[0.2em] text-primary group-hover:tracking-[0.25em] transition-all duration-300">
                              {booking.verification_code}
                            </p>
                            <div className="mt-4 inline-flex items-center gap-2 bg-primary-container/30 px-4 py-2 rounded-full text-sm font-bold text-primary border border-primary-fixed/20 hover:bg-primary-container/50 transition-colors duration-300">
                              <span className="material-symbols-outlined text-sm">
                                shield_person
                              </span>
                              Tunjukkan pada resepsionis
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Invoice Details */}
                    <div className="glass-panel px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/30">
                      <div className="text-sm text-on-surface-variant">
                        Waktu Transaksi:{" "}
                        <span className="font-bold text-on-surface">
                          {formattedBookingDate}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-on-surface-variant space-y-0.5">
                          <div>Sewa: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(booking.gross_amount)}</div>
                          {adminFee > 0 && <div>Biaya Layanan: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(adminFee)}</div>}
                        </div>
                        <div className="text-xl font-headline font-black flex items-center gap-3 mt-1">
                          {booking.status === "pending" ? "Tagihan:" : "Lunas:"}{" "}
                          <span className="gradient-text">{formattedAmount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>

            {/* ── Right: Actions & Secondary Details ── */}
            <div className="lg:col-span-5 space-y-6">
              {/* Payment Details */}
              {paymentData && (
                <RevealOnScroll delay={100}>
                  {booking.status === "pending" ? (
                    <div className="glass-panel rounded-3xl p-6 border border-primary-fixed/20 hover:shadow-xl transition-all duration-500 tilt-card group">
                      <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-sm text-on-primary">
                            payments
                          </span>
                        </span>
                        Detail Pembayaran
                      </h3>

                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-on-surface-variant">Metode</span>
                          <span className="font-semibold">{paymentData.payment_name || paymentData.method}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-on-surface-variant">Total</span>
                          <span className="font-semibold">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(paymentData.total_amount || totalAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-on-surface-variant">Referensi</span>
                          <span className="font-mono text-xs">{paymentData.reference}</span>
                        </div>
                      </div>

                      {(paymentData.method === "QRIS2" || paymentData.qr_url) && (
                        <div className="mt-4 p-4 bg-white rounded-2xl flex flex-col items-center">
                          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Scan QRIS untuk membayar</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={paymentData.qr_url} alt="QRIS" loading="lazy" className="w-48 h-48" />
                        </div>
                      )}

                      {paymentData.pay_code && paymentData.method !== "QRIS2" && (
                        <div className="mt-4 p-4 bg-white rounded-2xl">
                          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Nomor Pembayaran</p>
                          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3">
                            <code className="text-lg font-mono font-bold tracking-wider flex-1 select-all">{paymentData.pay_code}</code>
                            <button
                              onClick={() => { navigator.clipboard.writeText(paymentData.pay_code); }}
                              className="hero-gradient text-on-primary text-xs font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
                            >
                              Salin
                            </button>
                          </div>
                        </div>
                      )}

                      <a
                        href={paymentData.checkout_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 w-full hero-gradient text-on-primary font-bold py-3 rounded-xl btn-3d cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        Cek Status Pembayaran
                      </a>
                    </div>
                  ) : (
                    <div className="glass-panel rounded-3xl p-6 border border-emerald-200/60 hover:shadow-xl transition-all duration-500 tilt-card group bg-emerald-50/40">
                      <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-sm text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        </span>
                        Pembayaran Berhasil
                      </h3>

                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-on-surface-variant">Metode</span>
                          <span className="font-semibold">{paymentData.payment_name || paymentData.method}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-on-surface-variant">Total Dibayar</span>
                          <span className="font-semibold text-emerald-600">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(paymentData.total_amount || totalAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-on-surface-variant">Referensi</span>
                          <span className="font-mono text-xs">{paymentData.reference}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </RevealOnScroll>
              )}

              {/* API Mock Callback Trigger (DEMO) */}
              {booking.status === "pending" && (
                <RevealOnScroll delay={150}>
                  <div className="glass-panel rounded-3xl p-6 border border-primary-fixed/20 hover:shadow-xl transition-all duration-500 tilt-card group">
                    <h3 className="font-bold text-on-surface mb-2 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-sm text-on-primary">
                          api
                        </span>
                      </span>
                      Simulator Pembayaran
                    </h3>
                    <p className="text-sm text-on-surface-variant mb-4">
                      Hanya untuk keperluan demo MVP. Bayar tagihan dan ubah
                      status booking secara simulasi.
                    </p>
                    <button
                      onClick={() => {
                        fetch(`/api/bookings/mock-payment`, {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${
                              document.cookie
                                .split("; ")
                                .find((row) => row.startsWith("access_token="))
                                ?.split("=")[1]
                            }`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ booking_id: booking.id }),
                        })
                          .then((r) => r.json())
                          .then((data) => {
                            if (data.success) window.location.reload();
                          })
                          .catch(() => {
                            alert("Gagal menghubungi server. Coba lagi.");
                          });
                      }}
                      className="w-full hero-gradient text-on-primary font-bold py-3 rounded-xl btn-3d cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 active:scale-95"
                    >
                      Simulasikan Status Lunas
                    </button>
                  </div>
                </RevealOnScroll>
              )}

              {/* Share Card */}
              <RevealOnScroll delay={200}>
                <div className="glass-panel rounded-3xl p-8 border border-white/40 hover:shadow-xl transition-all duration-500 tilt-card group">
                  <h3 className="text-xl font-headline font-bold text-on-surface mb-3">
                    Koordinasikan Tim Anda
                  </h3>
                  <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
                    Kirim detail booking ke WhatsApp grup mabar Anda supaya
                    tidak ada teman yang datang terlambat.
                  </p>
                  <button
                    onClick={async () => {
                      const url = `${window.location.origin}/booking-confirmation?id=${booking.id}`;
                      const message = [
                        `┌─ *YUK MABAR!* ─────────────────────┐`,
                        ``,
                        `  📍 *VENUE*`,
                        `     ${booking.venue_name}`,
                        ``,
                        `  🏟️ *COURT*`,
                        `     ${booking.court_name}`,
                        ``,
                        `  📅 *JADWAL*`,
                        `     ${formattedDate} · ${booking.slot_time}`,
                        ``,
                        `  🔑 *KODE BOOKING*`,
                        `     ${booking.verification_code || "PDL-****"}`,
                        ``,
                        `  💰 *TOTAL*`,
                        `     ${formattedAmount}`,
                        ``,
                        `  ─────────────────────────────────`,
                        `  Gas main bareng! 🎾`,
                        `  ${url}`,
                        `└─────────────────────────────────────┘`,
                      ].join("\n");

                      const token = document.cookie
                        .split("; ")
                        .find((row) => row.startsWith("access_token="))
                        ?.split("=")[1];

                      try {
                        const res = await fetch(`/api/bookings/${booking.id}/share`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert("✅ Pesanan dikirim ke WhatsApp Anda!");
                          return;
                        }
                        alert(data.error || "Gagal mengirim");
                      } catch {
                        if (navigator.share) {
                          try {
                            await navigator.share({ title: "Yuk Mabar! 🎾", text: message });
                            return;
                          } catch {}
                        }
                        window.open(
                          `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }
                    }}
                    className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-[#20bd5a] transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md shadow-[#25D366]/20 btn-3d"
                  >
                    <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Kirim ke Grup Mabar
                  </button>
                </div>
              </RevealOnScroll>

              {/* Tips Card */}
              <RevealOnScroll delay={250}>
                <div className="glass-panel flex items-start gap-4 p-6 rounded-3xl border border-white/40 hover:shadow-xl transition-all duration-500 tilt-card group">
                  <span
                    className="material-symbols-outlined text-3xl text-amber-500 floating-element mt-4"
                    style={{ animationDuration: "4s" }}
                  >
                    lightbulb
                  </span>
                  <div>
                    <h4 className="font-bold text-on-surface mb-1">
                      Tips Bermain
                    </h4>
                    <p className="text-sm text-on-surface-variant">
                      Datanglah 15 menit lebih awal untuk pemanasan. Jangan lupa
                      bawa handuk dan air minum.
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>

          {/* Action Footer */}
          <RevealOnScroll delay={300}>
            <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/30">
              <Link href="/">
                <button className="flex items-center gap-2 text-on-surface-variant font-bold hover:text-primary transition-all duration-300 cursor-pointer group/home">
                  <span className="material-symbols-outlined group-hover/home:-translate-x-1 transition-transform duration-300">
                    home
                  </span>
                  Kembali ke Beranda
                </button>
              </Link>
              <div className="flex gap-4 w-full md:w-auto">
                <button
                  onClick={() => window.print()}
                  className="glass-panel border border-white/40 flex-1 md:flex-none text-on-surface px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:bg-white/60 transition-all duration-300 cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm mr-1 align-middle">
                    print
                  </span>
                  Cetak Tiket
                </button>
                <Link href="/explore" className="flex-1 md:flex-none">
                  <button className="w-full bg-primary text-on-primary px-8 py-4 rounded-xl font-bold btn-3d hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 active:scale-95 cursor-pointer">
                    <span className="material-symbols-outlined text-sm mr-1 align-middle">
                      add
                    </span>
                    Pesan Lagi
                  </button>
                </Link>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}

export default function ConfirmationContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full skeleton-pulse mx-auto" />
            <div className="h-6 w-48 skeleton-pulse rounded-lg mx-auto" />
          </div>
        </div>
      }
    >
      <ConfirmationBody />
    </Suspense>
  );
}
