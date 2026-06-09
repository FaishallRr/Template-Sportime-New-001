"use client";

import { useState, useEffect } from "react";
import SidebarNav from "@/components/dashboard/SidebarNav";
import TopBar from "@/components/dashboard/TopBar";
import ToastContainer from "@/components/dashboard/ToastContainer";
import {
  SidebarProvider,
  ToastProvider,
} from "@/components/dashboard/DashboardContext";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchBadges = async () => {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      if (!token) return;
      try {
        const res = await fetch("/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data) {
          setBadges({
            mitra: json.data.pending_mitras || 0,
            withdrawals: json.data.pending_withdrawals || 0,
            reviews: json.data.flagged_reviews || 0,
          });
        }
      } catch {}
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, []);

  const adminNavItems = [
    { icon: "dashboard", label: "Pusat Kendali", href: "/admin" },
    {
      icon: "handshake",
      label: "Cabang & Mitra",
      href: "/admin/mitra",
      badge: badges.mitra,
    },
    {
      icon: "calendar_month",
      label: "Riwayat Transaksi",
      href: "/admin/bookings",
    },
    {
      icon: "account_balance",
      label: "Pembukuan & Cair",
      href: "/admin/cashflow",
    },
    {
      icon: "payments",
      label: "Pencairan Dana",
      href: "/admin/withdrawals",
      badge: badges.withdrawals,
    },
    {
      icon: "confirmation_number",
      label: "Kode Promo",
      href: "/admin/promo",
    },
    {
      icon: "rate_review",
      label: "Moderasi Ulasan",
      href: "/admin/reviews",
      badge: badges.reviews,
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ToastProvider>
        <SidebarProvider>
          <div className="flex min-h-screen bg-slate-50/50">
            <SidebarNav
              items={adminNavItems}
              brandTitle="SportTime"
              brandSubtitle="Sistem Super Admin"
              accentColor="blue"
            />
            <div className="flex-grow md:ml-64 flex flex-col min-h-screen">
              <TopBar
                accentColor="blue"
              />
              <main className="flex-grow p-4 md:p-8">{children}</main>
            </div>
            <ToastContainer />
          </div>
        </SidebarProvider>
      </ToastProvider>
    </ProtectedRoute>
  );
}
