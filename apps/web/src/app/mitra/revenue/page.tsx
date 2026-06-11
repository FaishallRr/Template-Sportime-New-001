"use client";

import { useState, useEffect } from "react";
import StatCard from "@/components/dashboard/StatCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import toast from "react-hot-toast";

type Transaction = {
  id: string;
  date: string;
  booking: string;
  gross: string;
  fee: string;
  payout: string;
  status: string;
};

type Withdrawal = {
  id: string;
  amount: number;
  admin_fee: number;
  net_amount: number;
  bank: string;
  date: string;
  status: string;
  reject_reason?: string;
};

type DailyRevenue = {
  day: string;
  value: number;
};

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    Catat: "bg-emerald-50 text-emerald-600",
    Pending: "bg-amber-50 text-amber-600",
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-emerald-50 text-emerald-600'}`}>{status}</span>;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
};

const txnColumns: Column[] = [
  { key: "id", label: "ID TXN", render: (v) => <span className="font-mono text-xs font-bold">{String(v)}</span> },
  { key: "date", label: "Tanggal" },
  { key: "gross", label: "Bruto", render: (v) => <span className="font-bold">{String(v)}</span> },
  { key: "fee", label: "Admin (5%)", render: (v) => <span className="text-red-400 font-bold text-xs">-{String(v)}</span> },
  { key: "payout", label: "Net Penghasilan", render: (v) => <span className="text-emerald-600 font-bold">{String(v)}</span> },
  { key: "status", label: "Status", render: (v) => statusBadge(String(v).replace('Settled', 'Catat')) },
];

export default function MitraRevenuePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthRevenue: 0,
    lastMonthRevenue: 0,
    totalRevenue: 0,
    availableBalance: 0,
    withdrawalFee: 0,
  });
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("this");

  const fetchData = async (monthRange?: string) => {
    setLoading(true);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      if (!token) return;

      const range = monthRange || selectedMonth;
      const [revenueRes, dailyRes, withdrawalsRes, txnRes] = await Promise.all([
        fetch("/api/mitra/revenue", { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/mitra/revenue/daily?range=${range}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/mitra/withdrawals", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/mitra/transactions", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const revenueData = await revenueRes.json();
      const dailyData = await dailyRes.json();
      const withdrawalsData = await withdrawalsRes.json();
      const txnData = await txnRes.json();

      if (revenueData.success) {
        setStats({
          monthRevenue: revenueData.data?.month_revenue || 0,
          lastMonthRevenue: revenueData.data?.last_month_revenue || 0,
          totalRevenue: revenueData.data?.total_revenue || 0,
          availableBalance: revenueData.data?.available_balance || 0,
          withdrawalFee: revenueData.data?.withdrawal_fee || 0,
        });
      }

      if (dailyData.success && dailyData.data) {
        setDailyRevenue(dailyData.data);
      }

      if (withdrawalsData.success && withdrawalsData.data) {
        setWithdrawals(withdrawalsData.data);
      }

      if (txnData.success && txnData.data) {
        setTransactions(txnData.data.map((t: any) => ({
          id: t.id,
          date: new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
          booking: t.booking_code || t.id.substring(0, 8).toUpperCase(),
          gross: formatCurrency(t.gross_amount),
          fee: formatCurrency(t.admin_fee),
          payout: formatCurrency(t.mitra_payout),
          status: t.status === "confirmed" || t.status === "completed" ? "Catat" : "Pending",
        })));
      }
    } catch (e) {
      console.error("Failed to fetch revenue data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const maxVal = dailyRevenue.length > 0 ? Math.max(...dailyRevenue.map((d) => d.value)) : 0;

  const handleWithdraw = async () => {
    if (stats.availableBalance <= 0) {
      toast.error("Tidak ada saldo yang bisa ditarik.");
      return;
    }

    const feePercent = 2; // match backend WITHDRAWAL_FEE_PERCENT
    const adminFee = Math.round(stats.availableBalance * feePercent / 100);
    const netAmount = stats.availableBalance - adminFee;

    const c = confirm(
      `Tarik Dana?\n\n` +
      `Jumlah: ${formatCurrency(stats.availableBalance)}\n` +
      `Biaya Admin (${feePercent}%): -${formatCurrency(adminFee)}\n` +
      `↓\n` +
      `Diterima: ${formatCurrency(netAmount)}\n\n` +
      `Lanjutkan?`
    );
    if (!c) return;

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      const res = await fetch("/api/mitra/withdrawals", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ amount: stats.availableBalance })
      }).then(r => r.json());

      if (res.success) {
        toast.success(res.message || "Penarikan berhasil diproses.");
        fetchData();
      } else {
        toast.error(res.error || "Gagal memproses penarikan.");
      }
    } catch (e) {
      toast.error("Gagal menghubungi server.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Uang Masuk</h1>
          <p className="text-slate-400 mt-1">Laporan pendapatan dan penarikan dana</p>
        </div>
        <button
          onClick={handleWithdraw}
          disabled={loading || stats.availableBalance <= 0}
          className="flex items-center gap-2 bg-lime-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-lime-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
          Tarik Dana
        </button>
      </div>

      {/* Revenue Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon="payments" 
            label="Bulan Ini" 
            value={formatCurrency(stats.monthRevenue)} 
            trend={stats.lastMonthRevenue > 0 ? `${Math.round((stats.monthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue * 100)}%` : undefined}
            trendUp={stats.monthRevenue >= stats.lastMonthRevenue}
            iconBg="bg-lime-50 text-lime-600" 
          />
          <StatCard icon="calendar_month" label="Bulan Lalu" value={formatCurrency(stats.lastMonthRevenue)} iconBg="bg-slate-100 text-slate-600" />
          <StatCard icon="savings" label="Total Pendapatan" value={formatCurrency(stats.totalRevenue)} iconBg="bg-emerald-50 text-emerald-600" />
          <StatCard icon="swap_horiz" label="Bisa Ditarik" value={formatCurrency(stats.availableBalance)} iconBg="bg-amber-50 text-amber-600" />
        </div>
      )}

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900">Grafik Pendapatan Harian</h3>
          <select
            className="text-sm bg-slate-50 border-none rounded-lg px-3 py-1.5 text-slate-500 font-medium cursor-pointer"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              fetchData(e.target.value);
            }}
          >
            <option value="this">Bulan Ini</option>
            <option value="last">Bulan Lalu</option>
          </select>
        </div>
        {loading ? (
          <div className="flex items-end gap-2 h-48">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="flex-1 bg-slate-100 rounded-t-lg animate-pulse" style={{ height: `${Math.random() * 80 + 20}%` }} />
            ))}
          </div>
        ) : dailyRevenue.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Belum ada data hari ini.</div>
        ) : (
          <div className="flex items-end gap-2 h-48">
            {dailyRevenue.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-lime-400 rounded-t-lg hover:bg-lime-500 transition-colors cursor-pointer relative group"
                  style={{ height: maxVal > 0 ? `${(d.value / maxVal) * 100}%` : '0%' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold z-10">
                    {formatCurrency(d.value)}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">{d.day}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal History */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <h3 className="font-bold text-slate-900 mb-4">Riwayat Penarikan Dana</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Belum ada riwayat penarikan.</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
                    <p className="font-bold text-sm">{formatCurrency(w.net_amount || w.amount)}</p>
                    <p className="text-xs text-slate-400">{w.bank} · {w.date}</p>
                    {w.admin_fee > 0 && (
                      <p className="text-xs text-red-400 mt-0.5">Biaya admin: -{formatCurrency(w.admin_fee)}</p>
                    )}
                    {w.status === "rejected" && w.reject_reason && (
                      <p className="text-xs text-red-400 mt-0.5">Alasan: {w.reject_reason}</p>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  w.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                  w.status === "rejected" ? "bg-red-50 text-red-500" :
                  w.status === "processing" ? "bg-blue-50 text-blue-600" :
                  "bg-amber-50 text-amber-600"
                }`}>
                  {w.status === "completed" ? "Selesai" :
                   w.status === "rejected" ? "Ditolak" :
                   w.status === "processing" ? "Diproses" :
                   "Menunggu"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="font-bold text-slate-900 mb-4">Riwayat Transaksi Masuk</h3>
        {loading ? (
          <div className="bg-slate-100 rounded-xl h-48 animate-pulse" />
        ) : transactions.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8 bg-white rounded-xl">Belum ada transaksi.</p>
        ) : (
          <DataTable columns={txnColumns} data={transactions} searchPlaceholder="Cari riwayat transaksi..." />
        )}
      </div>
    </div>
  );
}