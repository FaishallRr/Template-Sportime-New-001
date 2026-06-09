"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import PageHeader from "@/components/dashboard/PageHeader";
import { useRouter } from "next/navigation";

const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    confirmed: "bg-emerald-50 border border-emerald-200 text-emerald-600",
    completed: "bg-blue-50 border border-blue-200 text-blue-600",
    pending_payment: "bg-amber-50 border border-amber-200 text-amber-600",
    cancelled: "bg-red-50 border border-red-200 text-red-500",
  };
  return (
    <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${colors[status] || "bg-slate-100"}`}>
      {status === "pending_payment" ? "Menunggu" : status === "confirmed" ? "Berhasil" : status}
    </span>
  );
};

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const columns: Column[] = [
  { key: "id", label: "ID", primary: true, render: (v) => <span className="font-mono font-bold text-slate-800 text-[11px] uppercase">{String(v).split("-")[0]}</span> },
  { key: "user", label: "Pemain" },
  { key: "venue", label: "Lapangan", hideOnMobile: true },
  { key: "date", label: "Tanggal" },
  { key: "time", label: "Waktu", hideOnMobile: true },
  { key: "amount", label: "Nominal", render: (v) => <span className="font-bold">{formatRupiah(Number(v))}</span> },
  { key: "status", label: "Status", render: (v) => statusBadge(String(v)) },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = (document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1]);
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch("/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` }
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const chartData = data?.revenue_chart || [];
  const chartValues = chartData.length > 0 ? chartData.map((d: any) => d.revenue) : [0];
  const maxChartRevenue = Math.max(...chartValues);

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Pusat Kendali Admin"
        subtitle="Pantau keamanan, transaksi, dan pertumbuhan ekosistem SportTime."
        icon="shield"
      />

      {/* Tombol Aksi Super Besar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Link href="/admin/mitra" className="block outline-none">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 transition-all rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 cursor-pointer flex flex-col items-center text-center h-full group border-2 border-indigo-400/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-500 text-white font-black text-xs px-3 py-1 rounded-bl-xl z-10 shadow-md">
              {data?.pending_mitras || 0} Menunggu
            </div>
            <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>domain_verification</span>
            </div>
            <h3 className="text-xl font-black mb-2">Validasi Mitra</h3>
            <p className="text-sm text-indigo-50 leading-relaxed font-medium">Tinjau & setujui pendaftaran pemilik lapangan yang baru mendaftar.</p>
          </div>
        </Link>
        
        <Link href="/admin/withdrawals" className="block outline-none">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 transition-all rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 cursor-pointer flex flex-col items-center text-center h-full group border-2 border-emerald-400/30 relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-red-500 text-white font-black text-xs px-3 py-1 rounded-bl-xl z-10 shadow-md">
              {data?.pending_withdrawals || 0} Pending
            </div>
            <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </div>
            <h3 className="text-xl font-black mb-2">Proses Payout Lapangan</h3>
            <p className="text-sm text-emerald-50 leading-relaxed font-medium">Setujui atau tolak permintaan pencairan dana dari mitra.</p>
          </div>
        </Link>

        <Link href="/admin/reviews" className="block outline-none">
          <div className="bg-gradient-to-br from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800 transition-all rounded-3xl p-6 text-white shadow-xl shadow-rose-200 cursor-pointer flex flex-col items-center text-center h-full group border-2 border-rose-400/30 relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-red-500 text-white font-black text-xs px-3 py-1 rounded-bl-xl z-10 shadow-md">
              {data?.flagged_reviews || 0} Dilaporkan
            </div>
            <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
            </div>
            <h3 className="text-xl font-black mb-2">Moderasi Komplain</h3>
            <p className="text-sm text-rose-50 leading-relaxed font-medium">Periksa ulasan kasar/palsu dari pemain yang dilaporkan oleh mitra.</p>
          </div>
        </Link>
      </div>

      {/* Ringkasan Keseluruhan Angka */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          icon="account_balance"
          label="Total Untung Platform"
          value={data ? formatRupiah(data.total_revenue) : "Rp 0"}
          trend="+18%"
          trendUp
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon="confirmation_number"
          label="Total Transaksi"
          value={data?.total_bookings?.toString() || "0"}
          trend="+1.2%"
          trendUp
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon="groups"
          label="Pengguna Terdaftar"
          value={data?.total_users?.toString() || "0"}
          trend="+12%"
          trendUp
          iconBg="bg-violet-50 text-violet-600"
        />
        <StatCard
          icon="handshake"
          label="Mitra Lapangan"
          value={data?.total_mitras?.toString() || "0"}
          trend="+2"
          trendUp
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Pendapatan yang Dipertahankan */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900">Grafik Kumpulan Transaksi</h3>
              <p className="text-slate-500 font-medium text-sm mt-1">Pantau tren jumlah pemain setiap bulannya.</p>
            </div>
            <select className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 font-bold outline-none cursor-pointer hover:bg-slate-100 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%236f768e%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10">
              <option>Tahun 2026</option>
              <option>Tahun 2025</option>
            </select>
          </div>
          
          <div className="flex items-end gap-2 md:gap-4 h-56 pt-6">
            {chartData.length > 0 ? chartData.map((d: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3">
                <div
                  className="w-full bg-slate-100 rounded-t-xl hover:bg-indigo-500 transition-all duration-300 cursor-pointer relative group border-t-2 border-transparent hover:border-indigo-400"
                  style={{ height: `${maxChartRevenue > 0 ? (d.revenue / maxChartRevenue) * 100 : 10}%`, minHeight: '10%' }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-black shadow-lg">
                    {formatRupiah(d.revenue)}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {d.month?.split(" ")[0] || months[i % 12]}
                </span>
              </div>
            )) : (
              <div className="w-full text-center text-slate-400 font-medium py-16">
                Belum ada data pendapatan
              </div>
            )}
          </div>
        </div>

        {/* Panel Bantuan Darurat & Setup */}
        <div className="space-y-6">
           <div className="bg-lime-50/80 rounded-3xl p-6 border-2 border-lime-200/50">
            <h3 className="font-black text-lime-900 mb-4 text-lg">Server Status</h3>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-2xl flex items-center justify-between border border-lime-100">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Database
                </span>
                <span className="text-sm font-black text-emerald-600">Terhubung</span>
              </div>
              <div className="bg-white p-3 rounded-2xl flex items-center justify-between border border-lime-100">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Midtrans
                </span>
                <span className="text-sm font-black text-emerald-600">Aktif</span>
              </div>
              <div className="bg-white p-3 rounded-2xl flex items-center justify-between border border-lime-100">
                <span className="text-sm font-bold text-slate-500 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  API WhatsApp
                </span>
                <span className="text-sm font-black text-emerald-600">Aktif</span>
              </div>
            </div>
            <button onClick={async () => {
              try {
                const token = (document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1]);
                if (!token) return;
                const res = await fetch("/api/admin/audit-logs", { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error("Gagal mengunduh");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "sporttime_audit_logs.csv";
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) { console.error(e); }
            }} className="w-full mt-5 bg-white text-lime-700 font-bold py-3 rounded-xl hover:bg-lime-100 transition-colors border border-lime-200 cursor-pointer shadow-sm text-xs">
              Unduh Seluruh Log Server (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Keseluruhan */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-4">Aktivitas Transaksi 5 Terbaru</h3>
        <DataTable
          columns={columns}
          data={data?.recent_bookings || []}
          searchPlaceholder="Cari nama pemain / lapangan..."
          emptyIcon="event_busy"
          emptyTitle="Belum ada transaksi"
          emptyDescription="Pembayaran dan booking akan muncul di tabel ini."
        />
      </div>
    </div>
  );
}
