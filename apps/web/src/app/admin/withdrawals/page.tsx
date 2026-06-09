"use client";

import { useState, useEffect } from "react";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/dashboard/PageHeader";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import toast from "react-hot-toast";

type Withdrawal = {
  id: string;
  mitra_id: string;
  mitra_name: string;
  amount: number;
  bank: string;
  account_full: string;
  bank_name: string;
  status: string;
  reject_reason: string;
  created_at: string;
  processed_at: string;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600 border border-amber-200",
    processing: "bg-blue-50 text-blue-600 border border-blue-200",
    completed: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    rejected: "bg-red-50 text-red-500 border border-red-200",
  };
  const labels: Record<string, string> = {
    pending: "Menunggu",
    processing: "Diproses",
    completed: "Selesai",
    rejected: "Ditolak",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || "bg-slate-50 text-slate-500"}`}>
      {labels[status] || status}
    </span>
  );
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      const token = document.cookie.split("; ").find((row) => row.startsWith("access_token="))?.split("=")[1];
      if (!token) return;
      const res = await fetch("/api/admin/withdrawals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setWithdrawals(data.data);
      }
    } catch {
      toast.error("Gagal memuat data penarikan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleApprove = async () => {
    if (!actionTarget) return;
    setProcessing(true);
    try {
      const token = document.cookie.split("; ").find((row) => row.startsWith("access_token="))?.split("=")[1];
      const res = await fetch(`/api/admin/withdrawals/${actionTarget.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Penarikan berhasil disetujui");
        fetchWithdrawals();
      } else {
        toast.error(data.error || "Gagal menyetujui");
      }
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setProcessing(false);
      setActionTarget(null);
      setActionType(null);
    }
  };

  const handleReject = async () => {
    if (!actionTarget || !rejectReason.trim()) return;
    setProcessing(true);
    try {
      const token = document.cookie.split("; ").find((row) => row.startsWith("access_token="))?.split("=")[1];
      const res = await fetch(`/api/admin/withdrawals/${actionTarget.id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Penarikan ditolak");
        fetchWithdrawals();
      } else {
        toast.error(data.error || "Gagal menolak");
      }
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setProcessing(false);
      setActionTarget(null);
      setActionType(null);
      setRejectReason("");
    }
  };

  const totalPending = withdrawals.filter((w) => w.status === "pending").length;
  const totalApproved = withdrawals.filter((w) => w.status === "completed").length;
  const totalAmount = withdrawals.reduce((s, w) => (w.status === "completed" ? s + w.amount : s), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pencairan Dana Mitra"
        subtitle="Setujui atau tolak permintaan penarikan dana dari mitra lapangan"
        icon="payments"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatCard icon="hourglass_empty" label="Menunggu" value={String(totalPending)} iconBg="bg-amber-50 text-amber-600" />
        <StatCard icon="check_circle" label="Terselesaikan" value={String(totalApproved)} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard icon="savings" label="Total Dicairkan" value={formatCurrency(totalAmount)} iconBg="bg-blue-50 text-blue-600" />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Memuat data penarikan...</div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <span className="material-symbols-outlined text-5xl text-slate-300" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          <p className="text-slate-400 mt-4 font-medium">Belum ada permintaan penarikan dana</p>
        </div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((w) => (
            <div key={w.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    w.status === "completed" ? "bg-emerald-100" :
                    w.status === "rejected" ? "bg-red-100" :
                    "bg-amber-100"
                  }`}>
                    <span className={`material-symbols-outlined ${
                      w.status === "completed" ? "text-emerald-600" :
                      w.status === "rejected" ? "text-red-500" :
                      "text-amber-600"
                    }`}>
                      {w.status === "completed" ? "check_circle" :
                       w.status === "rejected" ? "cancel" : "schedule"}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-slate-900">{w.mitra_name}</h4>
                      {statusBadge(w.status)}
                    </div>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(w.amount)}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {w.bank} &middot; {w.created_at}
                    </p>
                    {w.status === "rejected" && w.reject_reason && (
                      <p className="text-xs text-red-500 mt-1">
                        Alasan: {w.reject_reason}
                      </p>
                    )}
                    {w.status === "completed" && (
                      <p className="text-xs text-slate-400 mt-1">Disetujui: {w.processed_at}</p>
                    )}
                  </div>
                </div>

                {w.status === "pending" && (
                  <div className="flex gap-2 md:shrink-0">
                    <button
                      onClick={() => { setActionTarget(w); setActionType("approve"); }}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">check</span>
                      Setujui
                    </button>
                    <button
                      onClick={() => { setActionTarget(w); setActionType("reject"); setRejectReason(""); }}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Confirmation */}
      <ConfirmDialog
        open={actionType === "approve"}
        onClose={() => { setActionTarget(null); setActionType(null); }}
        onConfirm={handleApprove}
        title="Setujui Penarikan Dana"
        message={`Apakah Anda yakin ingin menyetujui penarikan dana sebesar ${actionTarget ? formatCurrency(actionTarget.amount) : ""} dari ${actionTarget?.mitra_name || ""}?`}
        confirmLabel="Setujui"
        cancelLabel="Batal"
        variant="info"
        loading={processing}
      />

      {/* Reject Dialog */}
      {actionType === "reject" && actionTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setActionTarget(null); setActionType(null); }} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-[scaleIn_0.2s_ease-out]">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-red-600" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Tolak Penarikan Dana</h3>
            <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
              Tolak penarikan {formatCurrency(actionTarget.amount)} dari {actionTarget.mitra_name}
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Alasan penolakan (wajib diisi)..."
              className="w-full border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-red-400 transition-colors resize-none min-h-[100px]"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setActionTarget(null); setActionType(null); setRejectReason(""); }}
                disabled={processing}
                className="flex-1 py-3 px-6 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="flex-1 py-3 px-6 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing && (
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                )}
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
