"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/dashboard/PageHeader";
import toast from "react-hot-toast";

interface Mitra {
  id: string;
  name: string;
  owner: string;
  phone: string;
  email: string;
  venues: number;
  revenue: string;
  status: string;
  bank: string;
  sport_types?: string;
  [key: string]: unknown;
}

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    Verified: "bg-emerald-50 text-emerald-600",
    Active: "bg-blue-50 text-blue-600",
    Pending: "bg-amber-50 text-amber-600",
    Suspended: "bg-red-50 text-red-500",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || "bg-slate-50 text-slate-500"}`}>
      {status}
    </span>
  );
};

export default function AdminMitraPage() {
  const router = useRouter();
  const [mitraList, setMitraList] = useState<Mitra[]>([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchMitras = async () => {
    setIsLoading(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      const res = await fetch("/api/admin/mitras", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMitraList(data.data);
      } else {
        setMitraList([]);
      }
    } catch {
      toast.error("Gagal memuat data mitra");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMitras();
  }, []);

  const handleAction = async (mitraId: string, action: string) => {
    const actionLabels: Record<string, string> = {
      verify: "memverifikasi",
      suspend: "menangguhkan",
      unsuspend: "mengaktifkan kembali",
    };
    if (!confirm(`Yakin ingin ${actionLabels[action]} mitra ini?`)) return;

    const toastId = toast.loading(`Sedang ${actionLabels[action]}...`);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      const res = await fetch(`/api/admin/mitras/${mitraId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message || "Berhasil!", { id: toastId });
        fetchMitras();
      } else {
        toast.error(res.error || "Gagal.", { id: toastId });
      }
    } catch {
      toast.error("Gagal menghubungi server.", { id: toastId });
    }
  };

  const totalMitras = mitraList.length;
  const verifiedCount = mitraList.filter((m) => m.status === "Verified").length;
  const pendingCount = mitraList.filter((m) => m.status === "Pending").length;
  const suspendedCount = mitraList.filter((m) => m.status === "Suspended").length;

  const filtered =
    filter === "all"
      ? mitraList
      : mitraList.filter((m) => m.status.toLowerCase() === filter);

  const columns: Column[] = [
    { key: "id", label: "ID", hideOnMobile: true, render: (v) => <span className="font-mono text-xs text-slate-500">{String(v).substring(0, 8).toUpperCase()}</span> },
    {
      key: "name",
      label: "Mitra",
      primary: true,
      render: (_v, row) => (
        <div>
          <p className="font-bold text-slate-800">{String(row.name)}</p>
          <p className="text-xs text-slate-400">{String(row.owner)}</p>
        </div>
      ),
    },
    { key: "phone", label: "Telepon", hideOnMobile: true },
    { key: "venues", label: "Venue", render: (v) => <span className="font-bold">{String(v)}</span> },
    {
      key: "sport_types",
      label: "Jenis Olahraga",
      hideOnMobile: true,
      render: (v) => (
        <div className="flex flex-wrap gap-1">
          {String(v || "").split(",").filter(s => s.trim()).map((sport, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium">
              {sport.trim()}
            </span>
          )) || <span className="text-slate-400 text-xs">-</span>}
        </div>
      ),
    },
    { key: "revenue", label: "Total Revenue", hideOnMobile: true, render: (v) => <span className="font-bold text-slate-800">{typeof v === "number" ? `Rp ${Number(v).toLocaleString("id-ID")}` : String(v)}</span> },
    { key: "status", label: "Status", render: (v) => statusBadge(String(v)) },
    {
      key: "actions",
      label: "Aksi",
      hideOnMobile: true,
      render: (_v, row) => (
        <div className="flex gap-2">
          {(String(row.status) === "Pending" || String(row.status) === "Active") && (
            <button onClick={() => handleAction(String(row.id), "verify")} className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors cursor-pointer">
              Verifikasi
            </button>
          )}
          {String(row.status) === "Verified" && (
            <button onClick={() => router.push(`/admin/mitra/${row.id}`)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer">
              Detail
            </button>
          )}
          {String(row.status) !== "Suspended" && (
            <button onClick={() => handleAction(String(row.id), "suspend")} className="px-3 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer">
              Suspend
            </button>
          )}
          {String(row.status) === "Suspended" && (
            <button onClick={() => handleAction(String(row.id), "unsuspend")} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer">
              Aktifkan
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Kelola Mitra"
        subtitle="Verifikasi dan kelola partner lapangan"
        icon="handshake"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard icon="storefront" label="Total Mitra" value={String(totalMitras)} iconBg="bg-blue-50 text-blue-600" />
        <StatCard icon="verified" label="Terverifikasi" value={String(verifiedCount)} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard icon="pending" label="Pending Verifikasi" value={String(pendingCount)} trend={pendingCount > 0 ? "urgent" : undefined} iconBg="bg-amber-50 text-amber-600" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {["all", "verified", "pending", "suspended"].map((f) => {
          const labels: Record<string, string> = { all: "Semua", verified: "Terverifikasi", pending: "Pending", suspended: "Suspended" };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === f
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {labels[f]}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-slate-400">Memuat data mitra...</div>
      ) : (
        <DataTable columns={columns} data={filtered} searchPlaceholder="Search mitra by name or owner..." />
      )}
    </div>
  );
}