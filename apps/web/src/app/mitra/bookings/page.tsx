"use client";

import { useState, useEffect } from "react";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import toast from "react-hot-toast";

interface Booking {
  id: string;
  image: string;
  user: string;
  court: string;
  date: string;
  time: string;
  amount: string;
  payout: string;
  status: string;
  [key: string]: unknown;
}

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    Selesai: "bg-emerald-50 text-emerald-600",
    "Sedang Main": "bg-blue-50 text-blue-600",
    "Akan Datang": "bg-amber-50 text-amber-600",
    Batal: "bg-red-50 text-red-500",
    Pending: "bg-slate-50 text-slate-500",
  };
  return (
    <span
      className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold ${colors[status] || "bg-slate-50 text-slate-600"}`}
    >
      {status}
    </span>
  );
};

const columns: Column[] = [
  {
    key: "image",
    label: "",
    hideOnMobile: false,
    render: (v) =>
      v ? (
        <img
          src={String(v)}
          alt="venue"
          className="w-10 h-10 rounded-lg object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-base text-slate-300">sports</span>
        </div>
      ),
  },
  {
    key: "id",
    label: "ID",
    primary: true,
    render: (v) => (
      <span className="font-mono font-bold text-xs md:text-sm">
        {String(v)}
      </span>
    ),
  },
  {
    key: "user",
    label: "Pemain",
    render: (v) => (
      <span className="font-medium text-xs md:text-sm">{String(v)}</span>
    ),
  },
  { key: "court", label: "Lapangan", hideOnMobile: false },
  { key: "date", label: "Tanggal", hideOnMobile: false },
  { key: "time", label: "Jam", hideOnMobile: false },
  {
    key: "payout",
    label: "Pendapatan",
    render: (v) => (
      <span className="font-bold text-emerald-600 text-xs md:text-sm">
        {String(v)}
      </span>
    ),
  },
  { key: "status", label: "Status", render: (v) => statusBadge(String(v)) },
];

export default function MitraBookingsPage() {
  const [filter, setFilter] = useState("semua");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      const res = await fetch("/api/mitra/bookings", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();

      if (data.success && data.data) {
        const formattedBookings = data.data.map((b: any) => {
          let statusIndo = "Pending";
          if (b.status === "confirmed") statusIndo = "Akan Datang";
          if (b.status === "pending" || b.status === "payment_pending") statusIndo = "Menunggu Bayar";
          if (b.status === "completed") statusIndo = "Selesai";
          if (b.status === "cancelled" || b.status === "expired") statusIndo = "Batal";

          const fmtDate = (d: string) => {
            if (!d) return "-";
            const clean = d.includes("T") ? d.split("T")[0] : d;
            const dt = new Date(clean + "T00:00:00");
            if (isNaN(dt.getTime())) return d;
            const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
            const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
            return `${days[dt.getDay()]}, ${dt.getDate()} ${months[dt.getMonth()]}`;
          };

          const fmtTime = (t: string) => {
            if (!t) return "-";
            const m = String(t).match(/(\d{2}:\d{2})/);
            return m ? m[1] : t.slice(0, 5);
          };

          const timeStart = fmtTime(b.slot_time);
          const timeEnd = fmtTime(b.slot_time_end || b.slot_time);

          return {
            id: b.id.substring(0, 8).toUpperCase(),
            image: b.venue_image || "",
            user: b.user_name || "-",
            court: b.court_name,
            date: fmtDate(b.slot_date),
            time: b.slot_date && b.slot_time ? `${timeStart} - ${timeEnd}` : "-",
            payout: `Rp ${(b.mitra_payout || 0).toLocaleString("id-ID")}`,
            status: statusIndo,
            fullId: b.id,
          };
        });
        setBookings(formattedBookings);
      }
    } catch (e) {
      toast.error("Gagal memuat daftar pesanan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filtered =
    filter === "semua"
      ? bookings
      : bookings.filter(
          (b) => b.status.toLowerCase().replace(" ", "-") === filter,
        );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
          Daftar Pesanan
        </h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">
          Pantau jadwal reservasi lapangan yang masuk secara real-time
        </p>
      </div>

      <div className="flex gap-0.5 md:gap-2 overflow-x-auto pb-2 md:pb-3 -mx-4 md:mx-0 px-4 md:px-0 flex-nowrap scrollbar-hide">
        {["semua", "akan-datang", "sedang-main", "selesai", "batal"].map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-1.5 md:px-4 py-1 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold transition-all cursor-pointer whitespace-nowrap capitalize flex-shrink-0 ${
                filter === f
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {f.replace("-", " ")}
            </button>
          ),
        )}
      </div>

      {/* Info Box - Only Admin Can Delete */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-3">
        <span className="material-symbols-outlined text-amber-600 text-xl md:text-2xl flex-shrink-0">
          lock
        </span>
        <div>
          <p className="text-sm md:text-base font-bold text-amber-900">
            Hanya Admin yang Bisa Batalkan Pesanan
          </p>
          <p className="text-xs md:text-sm text-amber-700 mt-1">
            Untuk membatalkan pesanan, hubungi tim admin. Admin dapat
            membatalkan pesanan satu per satu dengan alasan yang jelas.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-slate-400 font-medium text-sm md:text-base">
          Memuat pesanan...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filtered}
            searchPlaceholder="Cari ID Pesanan atau nama pemain..."
          />
        </div>
      )}
    </div>
  );
}
