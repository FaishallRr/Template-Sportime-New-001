"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/Skeleton";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  avatar_url: string | null;
  created_at: string;
};

type BankAccount = {
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_verified: boolean;
  verified_at: string | null;
};

type NotificationSettings = {
  notify_booking: boolean;
  notify_payment: boolean;
  notify_review: boolean;
  notify_daily: boolean;
  daily_report_time: string;
};

const bankOptions = [
  { value: "BCA", label: "BCA" },
  { value: "Mandiri", label: "Mandiri" },
  { value: "BNI", label: "BNI" },
  { value: "BRI", label: "BRI" },
  { value: "CIMB Niaga", label: "CIMB Niaga" },
];

export default function MitraSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bank, setBank] = useState<BankAccount | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    notify_booking: true,
    notify_payment: true,
    notify_review: false,
    notify_daily: true,
    daily_report_time: "21:00",
  });

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    bank_name: "",
    account_number: "",
    account_holder: "",
    wa_number: "",
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      if (!token) return;

      const res = await fetch("/api/mitra/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;
        setProfile(d);
        setFormData(prev => ({
          ...prev,
          full_name: d.full_name || "",
          phone: d.phone || "",
          address: d.address || "",
          wa_number: d.wa_number || "",
          bank_name: d.bank_name || "",
          account_number: d.account_number || "",
          account_holder: d.account_holder || "",
        }));
        setBank({
          bank_name: d.bank_name || "",
          account_number: d.account_number || "",
          account_holder: d.account_holder || "",
          is_verified: d.is_verified ?? false,
          verified_at: d.verified_at || null,
        });
        setNotifications({
          notify_booking: d.notify_booking ?? true,
          notify_payment: d.notify_payment ?? true,
          notify_review: d.notify_review ?? false,
          notify_daily: d.notify_daily ?? true,
          daily_report_time: d.daily_report_time || "21:00",
        });
      }
    } catch (e) {
      console.error("Failed to fetch settings:", e);
      toast.error("Gagal memuat pengaturan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      
      const res = await fetch("/api/mitra/settings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          wa_number: formData.wa_number,
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          account_holder: formData.account_holder,
          ...notifications,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Pengaturan berhasil disimpan!");
        fetchSettings();
      } else {
        toast.error(data.error || "Gagal menyimpan pengaturan.");
      }
    } catch (e) {
      toast.error("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  const hiddenFileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
        const res = await fetch("/api/auth/profile", {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ avatar_url: dataUrl }),
        });
        const data = await res.json();
        if (data.success) toast.success("Foto profil diperbarui!");
        else toast.error(data.error || "Gagal mengunggah foto.");
      } catch { toast.error("Gagal menghubungi server."); }
    };
    reader.readAsDataURL(file);
  };

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const initials = profile?.full_name 
    ? profile.full_name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "?";

  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString("id-ID", { month: "short", year: "numeric" })
    : "";

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Pengaturan</h1>
        <p className="text-slate-400 mt-1">Kelola detail profil dan rekening bank Anda</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl p-8 border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400">person</span>
          Informasi Profil
        </h3>
        <div className="space-y-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-slate-800 text-white flex items-center justify-center text-2xl font-black">
              {loading ? <Skeleton className="w-full h-full rounded-full bg-slate-700" /> : initials}
            </div>
            <div>
              <p className="font-bold text-lg">{loading ? <Skeleton className="h-6 w-48 inline-block" /> : profile?.full_name}</p>
              <p className="text-sm text-slate-400">Mitra sejak {memberSince}</p>
              <input ref={hiddenFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <button
                className="text-sm text-lime-600 font-bold mt-1 hover:underline cursor-pointer"
                onClick={() => hiddenFileRef.current?.click()}
              >
                Ubah Foto
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nama Lengkap</label>
              <input
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none font-medium"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nomor Telepon / WA</label>
              <input
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none font-medium"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Alamat Email</label>
              <input
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none font-medium"
                value={profile?.email || ""}
                disabled
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Alamat Lengkap</label>
              <input
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none font-medium"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={loading}
                placeholder="Jl. Sultan Agung No. 102, Semarang"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nomor WhatsApp Notifikasi (jika berbeda dari telepon)</label>
              <input
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none font-medium"
                value={formData.wa_number}
                onChange={(e) => setFormData({ ...formData, wa_number: e.target.value })}
                disabled={loading}
                placeholder="08xxxx xxxx"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bank Account Section */}
      <div className="bg-white rounded-2xl p-8 border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400">account_balance</span>
          Rekening Bank
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Rekening ini akan divalidasi otomatis oleh sistem untuk menerima payout 95% penghasilan.
        </p>
        
        {bank ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white mb-6">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-50 font-bold">Bank Terhubung</p>
                <p className="text-2xl font-black mt-1">{bank.bank_name}</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${bank.is_verified ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
                <span className={`w-2 h-2 rounded-full ${bank.is_verified ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span className={`text-xs font-bold ${bank.is_verified ? "text-emerald-400" : "text-amber-400"}`}>
                  {bank.is_verified ? "Terverifikasi" : "Menunggu Verifikasi"}
                </span>
              </div>
            </div>
            <p className="text-2xl font-mono tracking-[0.2em] mb-2">
              {bank.account_number ? `****${bank.account_number.slice(-4)}` : "----"}
            </p>
            <p className="text-sm opacity-60">a.n. {bank.account_holder}</p>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-6 text-white mb-6 border border-dashed border-slate-300">
            <p className="text-slate-500 text-center">Belum ada rekening terhubung.</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pilih Bank</label>
              <select
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none font-medium"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                disabled={loading}
              >
                <option value="">Pilih Bank...</option>
                {bankOptions.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nomor Rekening</label>
              <input
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none font-medium"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                disabled={loading}
                placeholder="1234567890"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nama Pemilik Rekening</label>
              <input
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none font-medium"
                value={formData.account_holder}
                onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                disabled={loading}
                placeholder="Nama sesuai rekening"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl p-8 border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400">notifications</span>
          Preferensi Notifikasi
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-bold text-sm text-slate-800">Pesanan Baru via WhatsApp</p>
              <p className="text-xs text-slate-400">Menerima detail pesanan langsung ke WA</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notifications.notify_booking}
                onChange={(e) => handleNotificationChange("notify_booking", e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-lime-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-500 shadow-inner" />
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-bold text-sm text-slate-800">Notifikasi Lonceng In-App</p>
              <p className="text-xs text-slate-400">Menerima pemberitahuan di aplikasi</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notifications.notify_payment}
                onChange={(e) => handleNotificationChange("notify_payment", e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-lime-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-500 shadow-inner" />
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-bold text-sm text-slate-800">Peringatan Ulasan Baru</p>
              <p className="text-xs text-slate-400">Beritahu saya saat pemain memberikan ulasan</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notifications.notify_review}
                onChange={(e) => handleNotificationChange("notify_review", e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-lime-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-500 shadow-inner" />
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-bold text-sm text-slate-800">Laporan Harian</p>
              <p className="text-xs text-slate-400">Kirim ringkasan otomatis setiap hari</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="bg-white rounded-lg px-3 py-1.5 text-sm font-medium border border-slate-200 focus:ring-2 focus:ring-lime-200 outline-none"
                value={notifications.daily_report_time}
                onChange={(e) => setNotifications(prev => ({ ...prev, daily_report_time: e.target.value }))}
                disabled={!notifications.notify_daily}
              >
                <option value="14:00">14:00</option>
                <option value="16:00">16:00</option>
                <option value="18:00">18:00</option>
                <option value="20:00">20:00</option>
                <option value="21:00">21:00</option>
                <option value="22:00">22:00</option>
              </select>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={notifications.notify_daily}
                  onChange={(e) => handleNotificationChange("notify_daily", e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-lime-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-500 shadow-inner" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button 
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-lime-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-lime-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        <button 
          onClick={() => fetchSettings()}
          disabled={saving || loading}
          className="bg-slate-100 text-slate-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
        >
          Batal
        </button>
      </div>
    </div>
  );
}



