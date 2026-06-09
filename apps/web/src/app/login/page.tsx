"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRemainingAttempts(null);

    if (!email.trim()) {
      setError("Email wajib diisi");
      return;
    }
    if (!password) {
      setError("Password wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal. Silakan coba lagi.");
        // Parse remaining attempts from error message
        const match = data.error?.match(/(\d+) percobaan tersisa/);
        if (match) setRemainingAttempts(parseInt(match[1]));
        return;
      }

      // Success
      document.cookie = `access_token=${data.data.access_token}; path=/; max-age=86400; SameSite=Lax`; document.cookie = `refresh_token=${data.data.refresh_token}; path=/; max-age=604800; SameSite=Lax`;
      
      document.cookie = `user=${encodeURIComponent(JSON.stringify(data.data.user))}; path=/; max-age=86400; SameSite=Lax`;

      setSuccessMsg("Login berhasil! Mengalihkan...");

      const user = data.data.user;
      setTimeout(() => {
        if (user.role === "admin") {
          router.push("/admin");
        } else if (user.role === "mitra") {
          router.push("/mitra");
        } else {
          router.push("/");
        }
      }, 1000);
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-lime-50/20 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 cursor-pointer">
              Sport<span className="text-blue-600">Time</span>
            </h1>
          </Link>
          <p className="text-sm text-slate-400 mt-1">Masuk ke akun Anda</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
            {/* Error */}
            {error && (
              <div className={`rounded-2xl p-4 flex items-start gap-3 ${
                remainingAttempts !== null && remainingAttempts <= 2
                  ? "bg-red-50 border border-red-200"
                  : "bg-amber-50 border border-amber-200"
              }`}>
                <span className="material-symbols-outlined text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>{
                  remainingAttempts !== null && remainingAttempts <= 2 ? "error" : "warning"
                }</span>
                <div>
                  <p className={`text-sm font-medium ${
                    remainingAttempts !== null && remainingAttempts <= 2 ? "text-red-700" : "text-amber-700"
                  }`}>{error}</p>
                  {remainingAttempts !== null && remainingAttempts <= 2 && (
                    <p className="text-xs text-red-500 mt-1">
                      ⚠ Akun akan dikunci setelah {remainingAttempts} percobaan lagi
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Success */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <p className="text-sm font-bold text-emerald-700">{successMsg}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-transparent focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <span className="material-symbols-outlined text-slate-400 text-xl">mail</span>
                <input
                  type="email"
                  className="flex-grow bg-transparent text-base outline-none placeholder:text-slate-400 text-slate-800"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">
                  Lupa password?
                </Link>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-transparent focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <span className="material-symbols-outlined text-slate-400 text-xl">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="flex-grow bg-transparent text-base outline-none placeholder:text-slate-400 text-slate-800"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-lg">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {loading && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
              {loading ? "Memproses..." : "Masuk"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-grow h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">atau</span>
              <div className="flex-grow h-px bg-slate-200" />
            </div>

            {/* Quick Demo Login Buttons */}
            <div className="space-y-2">
               <button type="button"
                 onClick={() => { setEmail("admin@padelpoint.id"); setPassword("Admin@2026"); }}
                 className="w-full py-3 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
               >
                <span className="material-symbols-outlined text-lg text-blue-600">admin_panel_settings</span>
                Demo Admin Login
              </button>
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => { setEmail("hadi@padelcenter.com"); setPassword("Mitra@2026"); }}
                  className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
                >
                  <span className="material-symbols-outlined text-base text-lime-600">storefront</span>
                  Demo Mitra
                </button>
                <button type="button"
                  onClick={() => { setEmail("user@demo.com"); setPassword("User@2026"); }}
                  className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
                >
                  <span className="material-symbols-outlined text-base text-violet-600">person</span>
                  Demo User
                </button>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Belum punya akun?{" "}
              <Link href="/register" className="font-bold text-blue-600 hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          <span>Koneksi aman terenkripsi</span>
        </div>
      </div>
    </div>
  );
}
