"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/dashboard/PageHeader";
import { useRouter } from "next/navigation";

const statusColor: Record<string, string> = {
  confirmed: "bg-emerald-100 border-emerald-300 text-emerald-800 font-bold",
  completed: "bg-slate-100 border-slate-200 text-slate-500",
  pending: "bg-amber-100 border-amber-300 text-amber-800 font-bold",
  cancelled: "bg-red-50 border border-red-300 text-red-600",
};

const statusIcon: Record<string, string> = {
  confirmed: "event_available",
  completed: "check_circle",
  pending: "schedule",
  cancelled: "cancel",
};

export default function MitraDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch("/api/mitra/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [router]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  const schedules = data?.recent_bookings || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Beranda Mitra"
        subtitle="Selamat datang! Apa yang ingin Anda kelola hari ini?"
        icon="home"
      />

      {/* Tiga Tombol Aksi Raksasa untuk kemudahan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Link href="/mitra/slots" className="block outline-none">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 transition-all rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 cursor-pointer flex flex-col items-center text-center h-full group">
            <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <span
                className="material-symbols-outlined text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                calendar_add_on
              </span>
            </div>
            <h3 className="text-xl font-black mb-2">Atur Jadwal</h3>
            <p className="text-sm text-emerald-50 leading-relaxed font-medium">
              Buka slot baru atau tutup lapangan yang sedang perbaikan.
            </p>
          </div>
        </Link>

        <Link href="/mitra/bookings" className="block outline-none">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-all rounded-3xl p-6 text-white shadow-xl shadow-blue-200 cursor-pointer flex flex-col items-center text-center h-full group">
            <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <span
                className="material-symbols-outlined text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                list_alt
              </span>
            </div>
            <h3 className="text-xl font-black mb-2">Daftar Booking</h3>
            <p className="text-sm text-blue-50 leading-relaxed font-medium">
              Lihat nama pemain yang sudah sewa dan mencetak struk.
            </p>
          </div>
        </Link>

        <Link href="/mitra/revenue" className="block outline-none">
          <div className="bg-gradient-to-br from-violet-500 to-violet-700 hover:from-violet-600 hover:to-violet-800 transition-all rounded-3xl p-6 text-white shadow-xl shadow-violet-200 cursor-pointer flex flex-col items-center text-center h-full group">
            <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <span
                className="material-symbols-outlined text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance_wallet
              </span>
            </div>
            <h3 className="text-xl font-black mb-2">Uang Masuk</h3>
            <p className="text-sm text-violet-50 leading-relaxed font-medium">
              Cek beranda pendapatan harian dan riwayat pencairan.
            </p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jadwal Hari Ini (Sangat Jelas & Besar) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Jadwal Main Hari Ini/Terbaru
              </h3>
              <p className="text-slate-500 font-medium text-sm mt-1">
                Pantau bookingan lapangan Anda.
              </p>
            </div>
            <div className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">today</span>
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>

          <div className="space-y-3">
            {schedules.length === 0 ? (
              <div className="text-center py-12">Belum ada jadwal terbaru.</div>
            ) : (
              schedules.map((slot: any, i: number) => (
                <div
                  key={i}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl border-2 transition-all ${statusColor[slot.status] || "bg-slate-50"}`}
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto sm:min-w-[140px] shrink-0">
                    <span
                      className="material-symbols-outlined text-2xl shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {statusIcon[slot.status] || "event"}
                    </span>
                    <span className="text-base sm:text-lg font-black tracking-tight uppercase">
                      {(slot.time.match(/(\d{2}:\d{2})/) || [])[1]}
                    </span>
                  </div>

                  <div className="bg-white/50 px-3 py-1 rounded-lg text-sm font-black w-24 shrink-0 hidden sm:block text-center border border-white/20 truncate">
                    {slot.court.substring(0, 10)}
                  </div>

                  <div className="flex-grow flex flex-col">
                    <span className="text-sm font-medium opacity-70 mb-0.5 sm:hidden">
                      {slot.court}
                    </span>
                    <span className="text-lg flex-grow truncate font-bold">
                      {slot.user}
                    </span>
                  </div>

                  <div className="text-xs font-black uppercase tracking-wider shrink-0 bg-white/40 px-3 py-1.5 rounded-xl text-center self-start sm:self-auto border border-white/20">
                    {slot.status === "pending_payment"
                      ? "BELUM BAYAR"
                      : slot.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ringkasan Singkat & Butuh Bantuan */}
        <div className="space-y-6">
          <div className="bg-lime-50 rounded-3xl p-6 border-2 border-lime-100">
            <h3 className="font-black text-lime-900 mb-4 text-lg">
              Ringkasan Info
            </h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-lime-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-1">
                    Total Main Hari Ini
                  </p>
                  <p className="text-2xl font-black text-slate-800">
                    {data?.today_bookings || 0} Sesi
                  </p>
                </div>
                <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center text-lime-600">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    sports_tennis
                  </span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-lime-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-1">
                    Uang Masuk Valid
                  </p>
                  <p className="text-[15px] font-black text-emerald-600">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(data?.total_revenue || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-emerald-500">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    payments
                  </span>
                </div>
              </div>
            </div>
            <Link href="/mitra/reviews">
              <button className="w-full mt-4 bg-lime-600 text-white font-bold py-3 rounded-xl hover:bg-lime-700 transition-colors cursor-pointer min-h-[48px]">
                Lacak Semua Ulasan
              </button>
            </Link>
          </div>

          <div className="bg-slate-800 rounded-3xl p-6 text-white text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-blue-400">
                support_agent
              </span>
            </div>
            <h3 className="font-black text-lg mb-2">Pusat Bantuan</h3>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Mengalami kesulitan mengelola lapangan? Tim SportTime siap
              membantu Anda.
            </p>
            <a
              href="https://wa.me/62895703047094"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-slate-800 w-full py-3 rounded-xl font-black text-sm hover:bg-slate-100 transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span
                className="material-symbols-outlined text-green-500 text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                chat
              </span>
              Hubungi via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
