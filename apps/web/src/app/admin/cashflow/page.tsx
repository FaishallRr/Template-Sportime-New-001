"use client";

import { useState, useEffect } from "react";
import { TableSkeleton } from "@/components/Skeleton";
import StatCard from "@/components/dashboard/StatCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import PageHeader from "@/components/dashboard/PageHeader";
import toast from "react-hot-toast";

interface Transaction {
  id: string;
  date: string;
  booking: string;
  gross: number;
  platformFee: number;
  mitraPayout: number;
  mitra: string;
  status: string;
  [key: string]: unknown;
}

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    confirmed: "bg-emerald-50 text-emerald-600",
    completed: "bg-emerald-50 text-emerald-600",
    settlement: "bg-emerald-50 text-emerald-600",
    Settled: "bg-emerald-50 text-emerald-600",
    Confirmed: "bg-emerald-50 text-emerald-600",
    Completed: "bg-emerald-50 text-emerald-600",
    pending: "bg-amber-50 text-amber-600",
    Pending: "bg-amber-50 text-amber-600",
    cancelled: "bg-red-50 text-red-500",
    Cancelled: "bg-red-50 text-red-500",
    Processing: "bg-blue-50 text-blue-600",
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || "bg-slate-50 text-slate-500"}`}>{status}</span>;
};

export default function AdminCashflowPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      const res = await fetch("/api/admin/transactions", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const formatted = data.data.map((t: any) => ({
          id: t.id?.substring(0, 8).toUpperCase() || "N/A",
          date: t.date || "-",
          booking: t.booking || "-",
          gross: t.gross || 0,
          platformFee: t.platform_fee || 0,
          mitraPayout: t.mitra_payout || 0,
          mitra: t.mitra || t.venue_name || "-",
          status: t.status || "-",
        }));
        setTransactions(formatted);
      }
    } catch {
      toast.error("Gagal memuat data transaksi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const totalGross = transactions.reduce((sum, t) => sum + (t.gross || 0), 0);
  const totalFee = transactions.reduce((sum, t) => sum + (t.platformFee || 0), 0);
  const totalPayout = transactions.reduce((sum, t) => sum + (t.mitraPayout || 0), 0);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const txnColumns: Column[] = [
    { key: "id", label: "TXN ID", primary: true, render: (v) => <span className="font-mono text-xs font-bold">{String(v)}</span> },
    { key: "date", label: "Tanggal" },
    { key: "mitra", label: "Mitra", hideOnMobile: true },
    { key: "gross", label: "Gross", render: (v) => <span className="font-bold">{formatRupiah(Number(v))}</span> },
    { key: "platformFee", label: "Fee (5%)", hideOnMobile: true, render: (v) => <span className="text-blue-600 font-bold">{formatRupiah(Number(v))}</span> },
    { key: "mitraPayout", label: "Mitra (95%)", hideOnMobile: true, render: (v) => <span className="text-emerald-600 font-bold">{formatRupiah(Number(v))}</span> },
    { key: "status", label: "Status", render: (v) => statusBadge(String(v)) },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cashflow Monitor"
        subtitle="Pantau split payment 5%/95% secara real-time"
        icon="account_balance"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard icon="account_balance" label="Total Transaksi" value={String(transactions.length)} iconBg="bg-slate-100 text-slate-700" />
        <StatCard icon="payments" label="Total Gross" value={`Rp ${totalGross.toLocaleString("id-ID")}`} iconBg="bg-blue-50 text-blue-600" />
        <StatCard icon="send_money" label="Mitra Payouts" value={`Rp ${totalPayout.toLocaleString("id-ID")}`} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard icon="swap_horiz" label="Platform Fee (5%)" value={`Rp ${totalFee.toLocaleString("id-ID")}`} iconBg="bg-amber-50 text-amber-600" />
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <div>
          <h3 className="font-bold text-slate-900 mb-4">Transaction History</h3>
          <DataTable columns={txnColumns} data={transactions} searchPlaceholder="Search transactions..." />
        </div>
      )}
    </div>
  );
}