"use client";

import { useState, useEffect } from "react";
import { TableSkeleton } from "@/components/Skeleton";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import PageHeader from "@/components/dashboard/PageHeader";
import toast from "react-hot-toast";

interface Booking {
  id: string;
  image: string;
  user: string;
  venue: string;
  court: string;
  date: string;
  time: string;
  amount: string;
  fee: string;
  method: string;
  status: string;
  fullId?: string;
  [key: string]: unknown;
}

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    Confirmed: "bg-blue-50 text-blue-600",
    Completed: "bg-emerald-50 text-emerald-600",
    Pending: "bg-amber-50 text-amber-600",
    Cancelled: "bg-red-50 text-red-500",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status]}`}
    >
      {status}
    </span>
  );
};

const methodBadge = (method: string) => {
  const icons: Record<string, string> = {
    QRIS: "qr_code_2",
    "E-Wallet": "account_balance_wallet",
    VA: "account_balance",
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className="material-symbols-outlined text-base text-slate-400">
        {icons[method]}
      </span>
      <span className="text-xs font-medium">{method}</span>
    </div>
  );
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      const res = await fetch("/api/admin/transactions?limit=200", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();

      if (data.success && data.data) {
        const formattedBookings = data.data.map((b: any) => ({
          id: b.id.substring(0, 8).toUpperCase(),
          image: b.venue_image || "",
          user: b.user_name,
          venue: b.venue_name || "Unknown",
          court: b.court_name || "Unknown",
          date: b.slot_date
            ? new Date(b.slot_date.split("T")[0] + "T00:00:00").toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "-",
          time: b.slot_time || "-",
          amount: `Rp ${(b.booking_price || b.gross_amount || 0).toLocaleString("id-ID")}`,
          fee: `Rp ${(b.platform_fee || b.admin_fee || 0).toLocaleString("id-ID")}`,
          method: b.payment_method || "Unknown",
          status:
            b.status === "confirmed"
              ? "Confirmed"
              : b.status === "completed"
                ? "Completed"
                : b.status === "cancelled"
                  ? "Cancelled"
                  : "Pending",
          fullId: b.id,
        }));
        setBookings(formattedBookings);
      }
    } catch (e) {
      toast.error("Gagal memuat daftar booking");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDeleteBooking = async (bookingId: string, fullId: string) => {
    if (
      !confirm(
        `Batalkan booking ${bookingId}? Tindakan ini tidak bisa dibatalkan.`,
      )
    )
      return;

    const toastId = toast.loading("Membatalkan booking...");
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      const res = await fetch(`/api/admin/bookings/${fullId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token },
      }).then((r) => r.json());

      if (res.success) {
        toast.success("Booking berhasil dibatalkan.", { id: toastId });
        fetchBookings();
      } else {
        toast.error(res.error || "Gagal membatalkan booking.", { id: toastId });
      }
    } catch (e) {
      toast.error("Gagal menghubungi server.", { id: toastId });
    }
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
        <span className="font-mono font-bold text-xs">{String(v)}</span>
      ),
    },
    {
      key: "user",
      label: "User",
      render: (v) => <span className="font-medium">{String(v)}</span>,
    },
    {
      key: "venue",
      label: "Venue",
      hideOnMobile: true,
      render: (_v, row) => (
        <div>
          <p className="font-medium text-sm">{String(row.venue)}</p>
          <p className="text-xs text-slate-400">{String(row.court)}</p>
        </div>
      ),
    },
    { key: "date", label: "Tanggal" },
    { key: "time", label: "Waktu", hideOnMobile: true },
    {
      key: "amount",
      label: "Jumlah",
      render: (v) => <span className="font-bold">{String(v)}</span>,
    },
    { key: "status", label: "Status", render: (v) => statusBadge(String(v)) },
    {
      key: "actions",
      label: "Aksi",
      hideOnMobile: true,
      render: (_v, row) =>
        row.status !== "Completed" && (
          <button
            onClick={() =>
              handleDeleteBooking(String(row.id), String(row.fullId))
            }
            className="px-3 py-2.5 bg-red-100 text-red-600 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors cursor-pointer min-h-[44px]"
            title="Batalkan Booking"
          >
            <span className="material-symbols-outlined text-sm inline mr-1">
              delete
            </span>
            Batalkan
          </button>
        ),
    },
  ];

  const filtered =
    statusFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status.toLowerCase() === statusFilter);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Semua Booking"
        subtitle="Kelola semua booking di seluruh venue"
        icon="calendar_month"
      />

      {/* Info Box - Admin Can Delete Individual Bookings */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-600 text-xl mt-0.5">
          info
        </span>
        <div>
          <p className="text-sm font-bold text-blue-900">
            Admin Dapat Batalkan Booking Satu Per Satu
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Hanya booking yang belum selesai (non-Completed) yang bisa
            dibatalkan. Sistem akan mencatat semua pembatalan untuk audit trail.
          </p>
        </div>
      </div>

      {/* Filters - scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "confirmed", "completed", "pending", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer capitalize whitespace-nowrap min-h-[44px] ${
              statusFilter === f
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {f === "all" ? "Semua" : f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Cari booking..."
          emptyIcon="event_busy"
          emptyTitle="Tidak ada booking"
        />
      )}
    </div>
  );
}
