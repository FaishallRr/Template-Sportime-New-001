import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSidebar } from "./DashboardContext";

interface TopBarProps {
  userName?: string;
  userRole?: string;
  avatarInitials?: string;
  accentColor?: "blue" | "green";
}

/* ─── Breadcrumb Labels ─── */
const breadcrumbLabels: Record<string, string> = {
  admin: "Pusat Kendali",
  mitra: "Mitra Lapangan",
  bookings: "Pesanan Masuk",
  cashflow: "Arus Kas",
  reviews: "Ulasan User",
  venues: "Profil Lapangan",
  slots: "Jadwal",
  revenue: "Uang Masuk",
  settings: "Pengaturan",
};

export default function TopBar({
  userName: initialName,
  userRole: initialRole,
  avatarInitials: initialInitials,
  accentColor = "blue",
}: TopBarProps) {
  const { toggle } = useSidebar();
  const pathname = usePathname();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = (document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1]);
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await fetch("/api/auth/me", {
          headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();
        
        if (data.success && data.data) {
          setProfile(data.data);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const isAdmin = (profile?.role || initialRole || "").toLowerCase().includes("admin");
    const isMitra = (profile?.role || initialRole || "").toLowerCase().includes("mitra");
    if (!isMitra && !isAdmin) return;

    const fetchNotifs = async () => {
      try {
        const token = (document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1]);
        if (!token) return;

        if (isMitra) {
          const [settingsRes, bookingsRes] = await Promise.all([
            fetch("/api/mitra/notifications", { headers: { "Authorization": "Bearer " + token } }).then(r => r.json()).catch(() => null),
            fetch("/api/mitra/bookings", { headers: { "Authorization": "Bearer " + token } }).then(r => r.json()).catch(() => null),
          ]);

          if (!bookingsRes?.success || !bookingsRes.data) return;

          const notifyBooking = settingsRes?.success ? settingsRes.data?.notify_booking !== false : true;
          if (!notifyBooking) {
            setNotifs([]);
            return;
          }

          setNotifs(bookingsRes.data.slice(0, 5));
        } else if (isAdmin) {
          const res = await fetch("/api/admin/dashboard", { headers: { "Authorization": "Bearer " + token } });
          const data = await res.json();
          if (data.success && data.data?.recent_bookings) {
            setNotifs(data.data.recent_bookings.slice(0, 5));
          }
        }
      } catch (e) {
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [initialRole, profile?.role]);

  const userRole = profile?.role || initialRole || "User";
  const userName = profile?.full_name || initialName || "User";
  const roleText = profile?.email ? `${userRole === "admin" ? "Super Admin" : "Mitra"} · ${profile.email.split('@')[0]}` : (initialRole || "User");
  const avatarInitials = profile?.full_name 
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : (initialInitials || "U");

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: breadcrumbLabels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  const accentAvatar = accentColor === "blue" ? "bg-blue-600" : "bg-lime-600";

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
      {/* Left: Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-600"
          aria-label="Toggle sidebar"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        <nav className="hidden md:flex items-center gap-1 text-sm" aria-label="Breadcrumb">
          <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-lg">home</span>
          </Link>
          {breadcrumbs.map((bc) => (
            <span key={bc.href} className="flex items-center">
              <span className="material-symbols-outlined text-slate-300 text-sm mx-1">
                chevron_right
              </span>
              {bc.isLast ? (
                <span className="font-semibold text-slate-800">{bc.label}</span>
              ) : (
                <Link
                  href={bc.href}
                  className="text-slate-400 hover:text-slate-600 transition-colors font-medium"
                >
                  {bc.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <h2 className="md:hidden font-bold text-slate-800 text-lg truncate">
          {breadcrumbs.length > 0
            ? breadcrumbs[breadcrumbs.length - 1].label
            : "Dashboard"}
        </h2>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input 
            type="text" 
            placeholder="Cari transaksi / lapangan..." 
            className="pl-10 pr-4 py-2 w-64 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-lime-200 focus:bg-white transition-all outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.currentTarget.value.toLowerCase();
                if (val.includes('lapangan') || val.includes('cabang')) window.location.href = '/mitra/venues';
                else if (val.includes('uang') || val.includes('kas')) window.location.href = '/mitra/revenue';
                else if (val.includes('pesan')) window.location.href = '/mitra/bookings';
                else {
                    import("react-hot-toast").then((m) => m.default.error("Pencarian tidak ditemukan"));
                }
              }
            }}
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 relative cursor-pointer group"
          >
            <span className="material-symbols-outlined group-hover:animate-[wiggle_0.5s_ease-in-out]">
              notifications
            </span>
            {notifs.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
          </button>

          <div className={`absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg transition-all z-50 overflow-hidden ${notifOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800">Notifikasi Terbaru</h3>
              <span className="text-[10px] uppercase font-bold text-lime-600 bg-lime-100 px-2 py-0.5 rounded-full">{notifs.length} Baru</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifs.length > 0 ? (
                notifs.map((n) => {
                    const fmtTime = (t: string) => {
                      if (!t) return "";
                      const m = String(t).match(/(\d{2}:\d{2})/);
                      return m ? m[1] : t.slice(0, 5);
                    };
                    const fmtDate = (d: string) => {
                      if (!d) return "";
                      const clean = d.includes("T") ? d.split("T")[0] : d;
                      const dt = new Date(clean + "T00:00:00");
                      if (isNaN(dt.getTime())) return d;
                      return `${dt.getDate()}/${dt.getMonth() + 1}`;
                    };
                    const isAdmin = (profile?.role || initialRole || "").toLowerCase().includes("admin");
                    const notifLink = isAdmin ? '/admin/bookings' : '/mitra/bookings';
                    const notifLabel = isAdmin ? (n.venue || n.court_name || "Venue") : (n.court_name || n.venue_name || "Court");
                    const notifUser = n.user_name || n.user || "Pemain";
                    return (
                  <div key={n.id} onClick={() => window.location.href = notifLink} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-xs font-semibold text-slate-800">Pesanan #{n.id?.substring(0,8).toUpperCase()}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{notifLabel} - {fmtDate(n.date || n.slot_date)} {fmtTime(n.time || n.slot_time)}{n.slot_time_end ? ` - ${fmtTime(n.slot_time_end)}` : ""} Oleh: {notifUser}</p>
                      <p className="text-[9px] text-slate-400 mt-1">Sistem Otomatis</p>
                  </div>
                    );
                  })
              ) : (
                  <div className="px-4 py-6 text-center text-slate-400 text-xs font-medium">Belum ada notifikasi baru</div>
              )}
            </div>
            <a href={(profile?.role || initialRole || "").toLowerCase().includes("admin") ? "/admin/bookings" : "/mitra/bookings"} className="block w-full text-center py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors">
              Lihat Semua Notifikasi
            </a>
          </div>
        </div>

        <div className="hidden md:block w-px h-8 bg-slate-200" />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button 
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 w-full text-left cursor-pointer hover:bg-slate-50 px-2 md:px-3 py-1.5 rounded-xl transition-colors"
          >
            <div className={`w-9 h-9 rounded-full ${accentAvatar} text-white flex items-center justify-center text-sm font-bold shadow-md`}>
              {loading ? "..." : avatarInitials}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {loading ? "Memuat..." : userName}
              </p>
              <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                {roleText}
              </p>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-lg hidden md:block">
              expand_more
            </span>
          </button>
          
          <div className={`absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg transition-all z-50 ${profileOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
            <div className="p-1">
               <button 
                 onClick={() => {
                   document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                   document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                   window.location.href = "/login";
                 }}
                 className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                   <span className="material-symbols-outlined text-[18px]">logout</span>
                   Keluar / Log Out
                </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}