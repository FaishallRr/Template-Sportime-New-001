"use client";

import SidebarNav from "@/components/dashboard/SidebarNav";
import TopBar from "@/components/dashboard/TopBar";
import ToastContainer from "@/components/dashboard/ToastContainer";
import {
  SidebarProvider,
  ToastProvider,
} from "@/components/dashboard/DashboardContext";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

const mitraNavItems = [
  { icon: "dashboard", label: "Beranda", href: "/mitra" },
  { icon: "stadium", label: "Profil Lapangan", href: "/mitra/venues" },
  { icon: "calendar_month", label: "Atur Jadwal & Slot", href: "/mitra/slots" },
  { icon: "book_online", label: "Daftar Pesanan", href: "/mitra/bookings" },
  {
    icon: "account_balance_wallet",
    label: "Uang Masuk",
    href: "/mitra/revenue",
  },
  { icon: "rate_review", label: "Ulasan Pemain", href: "/mitra/reviews" },
  { icon: "settings", label: "Pengaturan Cabang", href: "/mitra/settings" },
];

export default function MitraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["mitra"]}>
      <ToastProvider>
        <SidebarProvider>
          <div className="flex min-h-screen bg-slate-50/50">
            <SidebarNav
              items={mitraNavItems}
              brandTitle="SportTime"
              brandSubtitle="Pengelola Lapangan"
              accentColor="green"
            />
            <div className="flex-grow md:ml-64 flex flex-col min-h-screen">
              <TopBar
                accentColor="green"
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