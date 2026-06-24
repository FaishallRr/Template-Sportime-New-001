"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RevealOnScroll from "@/components/RevealOnScroll";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  role: string;
  created_at: string;
}

export default function ProfileContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = (document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1]);
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          document.cookie = 'access_token=; path=/; max-age=0'; document.cookie = 'user=; path=/; max-age=0';
          router.push("/login");
          return;
        }

        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          setFormData({
            full_name: data.data.full_name || "",
            phone: data.data.phone || "",
            address: data.data.address || "",
          });
        }
      } catch (err) {
        console.error("Gagal memuat profil", err);
        toast.error("Gagal memuat profil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    const token = (document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1]);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.error || "Gagal memperbarui profil" });
        return;
      }

      setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
      
      // Update local storage user snippet so Navbar updates dynamically
      const storedUserStr = (document.cookie.split('; ').find(row => row.startsWith('user=')) ? (decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('user='))?.split('=')[1] || '{}')) : null);
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        storedUser.full_name = formData.full_name;
        document.cookie = `user=${encodeURIComponent(JSON.stringify(storedUser))}; path=/; max-age=86400`;
        
        // Dispatch custom event to let navbar know if we wanted, but reload is easiest
        // For smoother UX, let's just let it be, or refresh
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setMessage({ type: "error", text: "Kesalahan koneksi ke server." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar activePage="profile" />
        <main className="pt-24 pb-12 bg-surface min-h-screen">
          <div className="container mx-auto px-6 max-w-3xl">
            {/* Title skeleton */}
            <div className="mb-8 space-y-3">
              <div className="h-10 w-64 skeleton-pulse rounded-xl" />
              <div className="h-5 w-48 skeleton-pulse rounded-lg" />
            </div>
            {/* Card skeleton */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white/40">
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/30">
                <div className="w-20 h-20 rounded-full skeleton-pulse" />
                <div className="space-y-2">
                  <div className="h-6 w-40 skeleton-pulse rounded-lg" />
                  <div className="h-4 w-56 skeleton-pulse rounded-lg" />
                  <div className="h-6 w-28 skeleton-pulse rounded-full mt-2" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="h-5 w-32 skeleton-pulse rounded-lg" />
                  <div className="h-12 skeleton-pulse rounded-xl" />
                  <div className="h-12 skeleton-pulse rounded-xl" />
                </div>
                <div className="space-y-4">
                  <div className="h-5 w-36 skeleton-pulse rounded-lg" />
                  <div className="h-12 skeleton-pulse rounded-xl" />
                  <div className="h-12 skeleton-pulse rounded-xl" />
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-white/30 flex justify-end">
                <div className="h-12 w-40 skeleton-pulse rounded-xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar activePage="profile" />
      
      <main className="pt-24 pb-12 bg-surface min-h-screen">
        <div className="container mx-auto px-6 max-w-3xl">
          {/* ── Page Header ── */}
          <RevealOnScroll>
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-primary font-bold text-sm tracking-wide uppercase shadow-inner mb-4">
                <span className="material-symbols-outlined text-sm">person</span>
                Profil Akun
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-[0.95]">
                Profil <span className="gradient-text">Saya</span>
              </h1>
              <p className="text-on-surface-variant mt-2">
                Kelola informasi akun Anda agar tetap mutakhir.
              </p>
            </div>
          </RevealOnScroll>

          <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 md:p-10 shadow-sm border border-white/40 tilt-card group hover:shadow-xl transition-all duration-500 relative">
            {/* Gradient border glow on hover */}
            <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
              <div className="absolute inset-[-2px] rounded-[2rem] bg-gradient-to-r from-primary-fixed/40 via-primary/20 to-primary-fixed/40 blur-sm" />
              <div className="absolute inset-0 rounded-[2rem] bg-white/60 backdrop-blur-xl" />
            </div>

            <div className="relative z-10">
              {/* ── Profile Header ── */}
              <RevealOnScroll delay={50}>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-white/30">
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-full hero-gradient p-0.5 floating-element shadow-lg shadow-primary/20">
                      <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                        <span className="text-3xl font-black text-primary">
                          {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    </div>
                    {/* Online dot */}
                    <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-primary-fixed border-2 border-surface shadow-sm" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-black text-on-surface">{profile?.full_name}</h2>
                    <p className="text-sm text-on-surface-variant font-mono">{profile?.email}</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 py-1.5 px-4 bg-primary-container/50 text-primary-dim text-xs font-bold rounded-full uppercase tracking-wider border border-primary-fixed/20">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                      {profile?.role === "user" ? "REGULAR USER" : profile?.role}
                    </div>
                  </div>
                </div>
              </RevealOnScroll>

              {/* ── Message Banner ── */}
              {message.text && (
                <RevealOnScroll delay={75}>
                  <div className={`p-4 rounded-xl mb-6 font-medium text-sm flex items-center gap-3 border ${
                    message.type === "error" 
                      ? "bg-error-container/80 text-on-error-container border-error/20 toast-enter" 
                      : "bg-primary-container/80 text-on-primary-container border-primary-fixed/20 toast-enter"
                  }`}>
                    <span className={`material-symbols-outlined ${
                      message.type === "error" ? "text-error" : "text-primary"
                    }`}>
                      {message.type === "error" ? "error" : "check_circle"}
                    </span>
                    <span className="flex-1">{message.text}</span>
                    <button
                      onClick={() => setMessage({ type: "", text: "" })}
                      className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </RevealOnScroll>
              )}

              {/* ── Edit Form ── */}
              <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Col — Informasi Dasar */}
                  <RevealOnScroll delay={100}>
                    <div className="space-y-5">
                      <h3 className="font-black text-on-surface flex items-center gap-2 text-lg">
                        <span className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-sm text-on-primary">edit_square</span>
                        </span>
                        Informasi Dasar
                      </h3>
                      
                      <div className="group/input">
                        <label className="block text-sm font-bold text-on-surface mb-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">person</span>
                          Nama Lengkap
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">
                            <span className="material-symbols-outlined text-lg">badge</span>
                          </div>
                          <input 
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            className="w-full bg-surface-container-low border border-outline-variant/50 pl-12 pr-4 py-3.5 rounded-xl focus-glow outline-none transition-all text-on-surface placeholder:text-outline-variant/60"
                            placeholder="Masukkan nama lengkap"
                            required
                            minLength={3}
                          />
                        </div>
                      </div>
                      
                      <div className="group/input">
                        <label className="block text-sm font-bold text-on-surface mb-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">phone_android</span>
                          Nomor WhatsApp
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">
                            <span className="material-symbols-outlined text-lg">call</span>
                          </div>
                          <input 
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-surface-container-low border border-outline-variant/50 pl-12 pr-4 py-3.5 rounded-xl focus-glow outline-none transition-all text-on-surface placeholder:text-outline-variant/60"
                            placeholder="08xxxxxxxxxx"
                            required
                            pattern="^[0-9]{10,15}$"
                            title="Masukkan 10-15 digit angka saja"
                          />
                        </div>
                      </div>
                    </div>
                  </RevealOnScroll>

                  {/* Right Col — Kredensial Keamanan */}
                  <RevealOnScroll delay={150}>
                    <div className="space-y-5">
                      <h3 className="font-black text-on-surface flex items-center gap-2 text-lg">
                        <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-sm text-outline-variant">lock</span>
                        </span>
                        Kredensial Keamanan
                      </h3>

                      <div className="group/input">
                        <label className="block text-sm font-bold text-on-surface mb-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">email</span>
                          Alamat Email
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant/30 pointer-events-none">
                            <span className="material-symbols-outlined text-lg">mail</span>
                          </div>
                          <div className="w-full bg-surface-container-high/50 border border-outline-variant/30 pl-12 pr-4 py-3.5 rounded-xl text-on-surface-variant/60 select-none flex items-center justify-between glass-panel">
                            <span className="font-mono">{profile?.email}</span>
                            <span className="material-symbols-outlined text-sm text-outline-variant/40">lock</span>
                          </div>
                        </div>
                        <p className="text-xs text-on-surface-variant/60 mt-1.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">info</span>
                          Email utama hanya dapat diubah melalui tim SportTime.
                        </p>
                      </div>

                      <div className="group/input">
                        <label className="block text-sm font-bold text-on-surface mb-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">home</span>
                          Alamat Rumah
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">
                            <span className="material-symbols-outlined text-lg">location_on</span>
                          </div>
                          <input 
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="w-full bg-surface-container-low border border-outline-variant/50 pl-12 pr-4 py-3.5 rounded-xl focus-glow outline-none transition-all text-on-surface placeholder:text-outline-variant/60"
                            placeholder="Masukkan alamat rumah"
                          />
                        </div>
                      </div>
                    </div>
                  </RevealOnScroll>
                </div>

                {/* ── Submit Button ── */}
                <RevealOnScroll delay={200}>
                  <div className="pt-8 mt-8 border-t border-white/30 flex flex-col sm:flex-row sm:justify-between items-center gap-4">
                    <p className="text-xs text-on-surface-variant/60 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">info</span>
                      Pastikan data yang Anda masukkan sudah benar.
                    </p>
                    <button 
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto bg-primary text-on-primary font-bold px-10 py-3.5 rounded-xl btn-3d hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px] active:scale-95 cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">save</span>
                          Simpan Perubahan
                        </>
                      )}
                    </button>
                  </div>
                </RevealOnScroll>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

