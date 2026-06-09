"use client";

import { useState, useEffect } from "react";
import StatCard from "@/components/dashboard/StatCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import PageHeader from "@/components/dashboard/PageHeader";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import toast from "react-hot-toast";

type Promo = {
  id: string;
  code: string;
  discount_percent: number;
  max_discount: number;
  min_booking_amount: number;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  created_at: string;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export default function AdminPromoPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Promo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promo | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(10);
  const [maxDiscount, setMaxDiscount] = useState(0);
  const [minAmount, setMinAmount] = useState(0);
  const [maxUses, setMaxUses] = useState(100);
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const fetchPromos = async () => {
    setIsLoading(true);
    try {
      const token = document.cookie.split("; ").find((row) => row.startsWith("access_token="))?.split("=")[1];
      if (!token) return;
      const res = await fetch("/api/admin/promos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPromos(data.data);
      }
    } catch {
      toast.error("Gagal memuat data promo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const resetForm = () => {
    setCode("");
    setDiscountPercent(10);
    setMaxDiscount(0);
    setMinAmount(0);
    setMaxUses(100);
    setValidFrom("");
    setValidUntil("");
    setEditTarget(null);
    setShowForm(false);
  };

  const openEdit = (p: Promo) => {
    setEditTarget(p);
    setCode(p.code);
    setDiscountPercent(p.discount_percent);
    setMaxDiscount(p.max_discount);
    setMinAmount(p.min_booking_amount);
    setMaxUses(p.max_uses);
    setValidFrom(p.valid_from);
    setValidUntil(p.valid_until);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!code.trim() || discountPercent <= 0) {
      toast.error("Kode dan diskon wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const token = document.cookie.split("; ").find((row) => row.startsWith("access_token="))?.split("=")[1];
      const body: any = {
        code: code.toUpperCase(),
        discount_percent: discountPercent,
        max_discount: maxDiscount,
        min_booking_amount: minAmount,
        max_uses: maxUses,
        valid_from: validFrom,
        valid_until: validUntil,
      };

      let res;
      if (editTarget) {
        const updateBody: any = {
          discount_percent: discountPercent,
          max_discount: maxDiscount,
          min_booking_amount: minAmount,
          max_uses: maxUses,
          valid_from: validFrom,
          valid_until: validUntil,
        };
        res = await fetch(`/api/admin/promos/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(updateBody),
        });
      } else {
        res = await fetch("/api/admin/promos", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      }

      const data = await res.json();
      if (data.success) {
        toast.success(editTarget ? "Promo diperbarui" : "Promo berhasil dibuat");
        resetForm();
        fetchPromos();
      } else {
        toast.error(data.error || "Gagal menyimpan promo");
      }
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const token = document.cookie.split("; ").find((row) => row.startsWith("access_token="))?.split("=")[1];
      const res = await fetch(`/api/admin/promos/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Promo berhasil dihapus");
        setDeleteTarget(null);
        fetchPromos();
      } else {
        toast.error(data.error || "Gagal menghapus promo");
      }
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: Promo) => {
    try {
      const token = document.cookie.split("; ").find((row) => row.startsWith("access_token="))?.split("=")[1];
      const res = await fetch(`/api/admin/promos/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(p.is_active ? "Promo dinonaktifkan" : "Promo diaktifkan");
        fetchPromos();
      }
    } catch {
      toast.error("Gagal memperbarui status promo");
    }
  };

  const totalActive = promos.filter((p) => p.is_active).length;
  const totalUsage = promos.reduce((s, p) => s + p.current_uses, 0);

  const columns: Column[] = [
    { key: "code", label: "Kode", primary: true, render: (v) => <span className="font-mono font-black text-sm uppercase">{String(v)}</span> },
    { key: "discount_percent", label: "Diskon", render: (v) => <span className="font-bold text-emerald-600">{String(v)}%</span> },
    { key: "max_uses", label: "Kuota", render: (_v, row) => <span className="text-xs font-bold">{String(row.current_uses)}/{String(row.max_uses)}</span> },
    { key: "valid_until", label: "Berlaku Sampai", hideOnMobile: true },
    {
      key: "is_active", label: "Status", render: (v) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${v ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
          {v ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      key: "actions", label: "", render: (_v, row) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(row as unknown as Promo)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Edit">
            <span className="material-symbols-outlined text-slate-400 text-lg">edit</span>
          </button>
          <button onClick={() => handleToggleActive(row as unknown as Promo)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title={row.is_active ? "Nonaktifkan" : "Aktifkan"}>
            <span className={`material-symbols-outlined text-lg ${row.is_active ? "text-emerald-500" : "text-slate-300"}`}>{row.is_active ? "toggle_on" : "toggle_off"}</span>
          </button>
          <button onClick={() => setDeleteTarget(row as unknown as Promo)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Hapus">
            <span className="material-symbols-outlined text-red-300 text-lg">delete</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Kode Promo"
        subtitle="Kelola kode promo dan diskon untuk pemain"
        icon="confirmation_number"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatCard icon="confirmation_number" label="Total Promo" value={String(promos.length)} iconBg="bg-blue-50 text-blue-600" />
        <StatCard icon="check_circle" label="Promo Aktif" value={String(totalActive)} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard icon="trending_up" label="Total Pemakaian" value={String(totalUsage)} iconBg="bg-amber-50 text-amber-600" />
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-4">{editTarget ? "Edit Promo" : "Buat Promo Baru"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Kode Promo</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="contoh: HEMAT50"
                disabled={!!editTarget}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors disabled:bg-slate-50 disabled:text-slate-400 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Diskon (%)</label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                min={1}
                max={100}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Maks. Diskon (Rp)</label>
              <input
                type="number"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Min. Booking (Rp)</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Maks. Pemakaian</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                min={1}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Berlaku Dari</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Berlaku Sampai</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
                {editTarget ? "Simpan" : "Buat Promo"}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Buat Promo Baru
        </button>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Memuat data promo...</div>
      ) : promos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <span className="material-symbols-outlined text-5xl text-slate-300" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
          <p className="text-slate-400 mt-4 font-medium">Belum ada kode promo</p>
        </div>
      ) : (
        <DataTable columns={columns} data={promos as unknown as Record<string, unknown>[]} searchPlaceholder="Cari kode promo..." />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Promo"
        message={`Apakah Anda yakin ingin menghapus kode promo "${deleteTarget?.code}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
