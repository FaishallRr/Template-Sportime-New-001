"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FormStep = "credentials" | "personal" | "mitra_info";

interface FormErrors {
  [key: string]: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<FormStep>("credentials");
  const [role, setRole] = useState<"user" | "mitra">("user");
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    address: "",
    ktp_number: "",
    bank_name: "",
    account_number: "",
    account_holder: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on edit
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setServerErrors([]);

    // Calculate password strength
    if (field === "password" && typeof value === "string") {
      let str = 0;
      if (value.length >= 8) str++;
      if (/[A-Z]/.test(value)) str++;
      if (/[a-z]/.test(value)) str++;
      if (/[0-9]/.test(value)) str++;
      if (/[^A-Za-z0-9]/.test(value)) str++;
      setPasswordStrength(str);
    }
  };

  // ── Client Validation ──
  const validateStep = (currentStep: FormStep): boolean => {
    const errs: FormErrors = {};

    if (currentStep === "credentials") {
      if (!formData.email) {
        errs.email = "Email wajib diisi";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errs.email = "Format email tidak valid";
      }
      if (!formData.phone) {
        errs.phone = "Nomor telepon wajib diisi";
      } else if (!/^[0-9]{10,15}$/.test(formData.phone)) {
        errs.phone = "Nomor telepon harus 10-15 digit angka";
      }
      if (!formData.password) {
        errs.password = "Password wajib diisi";
      } else {
        if (formData.password.length < 8) errs.password = "Password minimal 8 karakter";
        else if (!/[A-Z]/.test(formData.password)) errs.password = "Password harus mengandung huruf besar";
        else if (!/[a-z]/.test(formData.password)) errs.password = "Password harus mengandung huruf kecil";
        else if (!/[0-9]/.test(formData.password)) errs.password = "Password harus mengandung angka";
      }
      if (formData.confirmPassword !== formData.password) {
        errs.confirmPassword = "Password tidak cocok";
      }
    }

    if (currentStep === "personal") {
      if (!formData.full_name) {
        errs.full_name = "Nama lengkap wajib diisi";
      } else if (formData.full_name.split(" ").filter(Boolean).length < 2) {
        errs.full_name = "Masukkan nama depan dan belakang";
      }
      if (!formData.address) {
        errs.address = "Alamat wajib diisi";
      } else if (formData.address.length < 10) {
        errs.address = "Alamat terlalu singkat (minimal 10 karakter)";
      }
      if (!formData.agreeTerms) {
        errs.agreeTerms = "Anda harus menyetujui syarat & ketentuan";
      }
    }

    if (currentStep === "mitra_info") {
      if (!formData.ktp_number) {
        errs.ktp_number = "Nomor KTP wajib diisi";
      } else if (!/^[0-9]{16}$/.test(formData.ktp_number)) {
        errs.ktp_number = "Nomor KTP harus 16 digit";
      }
      if (!formData.bank_name) errs.bank_name = "Nama bank wajib dipilih";
      if (!formData.account_number) errs.account_number = "Nomor rekening wajib diisi";
      if (!formData.account_holder) errs.account_holder = "Nama pemilik rekening wajib diisi";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    if (step === "credentials") {
      setStep("personal");
    } else if (step === "personal" && role === "mitra") {
      setStep("mitra_info");
    }
  };

  const prevStep = () => {
    if (step === "mitra_info") setStep("personal");
    else if (step === "personal") setStep("credentials");
  };

  const handleSubmit = async () => {
    const lastStep = role === "mitra" ? "mitra_info" : "personal";
    if (!validateStep(lastStep)) return;

    setLoading(true);
    setServerErrors([]);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          full_name: formData.full_name.trim(),
          role,
          address: formData.address.trim(),
          ktp_number: role === "mitra" ? formData.ktp_number : undefined,
          bank_name: role === "mitra" ? formData.bank_name : undefined,
          account_number: role === "mitra" ? formData.account_number : undefined,
          account_holder: role === "mitra" ? formData.account_holder : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.data?.validation_errors) {
          setServerErrors(data.data.validation_errors);
        } else {
          setServerErrors([data.error || "Terjadi kesalahan. Silakan coba lagi."]);
        }
        return;
      }

      // Success — store token
      document.cookie = `access_token=${data.data.access_token}; path=/; max-age=86400; SameSite=Lax`; document.cookie = `refresh_token=${data.data.refresh_token}; path=/; max-age=604800; SameSite=Lax`;
      
      document.cookie = `user=${encodeURIComponent(JSON.stringify(data.data.user))}; path=/; max-age=86400; SameSite=Lax`;

      setSuccessMsg("Registrasi berhasil! Mengalihkan...");
      setTimeout(() => {
        if (role === "mitra") {
          router.push("/mitra");
        } else {
          router.push("/explore");
        }
      }, 1500);
    } catch {
      setServerErrors(["Tidak dapat terhubung ke server. Coba lagi nanti."]);
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-lime-400", "bg-emerald-400"];
  const strengthLabels = ["Sangat Lemah", "Lemah", "Cukup", "Kuat", "Sangat Kuat"];

  const banks = ["BCA", "BNI", "BRI", "Mandiri", "CIMB Niaga", "BSI", "Bank Jateng", "Bank Mega", "Permata", "OCBC"];

  const steps: { key: FormStep; label: string }[] =
    role === "mitra"
      ? [
          { key: "credentials", label: "Akun" },
          { key: "personal", label: "Data Diri" },
          { key: "mitra_info", label: "Data Mitra" },
        ]
      : [
          { key: "credentials", label: "Akun" },
          { key: "personal", label: "Data Diri" },
        ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-lime-50/20 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 cursor-pointer">
              Sport<span className="text-blue-600">Time</span>
            </h1>
          </Link>
          <p className="text-sm text-slate-400 mt-1">Daftar akun baru</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Role Selector */}
          <div className="p-6 pb-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Daftar sebagai</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setRole("user"); setStep("credentials"); }}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                  role === "user"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className={`material-symbols-outlined text-2xl ${role === "user" ? "text-blue-600" : "text-slate-400"}`}
                  style={role === "user" ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >person</span>
                <p className="font-bold text-sm mt-2 text-slate-800">Pengguna</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Booking lapangan olahraga</p>
              </button>
              <button
                onClick={() => { setRole("mitra"); setStep("credentials"); }}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                  role === "mitra"
                    ? "border-lime-500 bg-lime-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className={`material-symbols-outlined text-2xl ${role === "mitra" ? "text-lime-600" : "text-slate-400"}`}
                  style={role === "mitra" ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >storefront</span>
                <p className="font-bold text-sm mt-2 text-slate-800">Mitra</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Daftarkan venue Anda</p>
              </button>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-2">
              {steps.map((s, i) => (
                <div key={s.key} className="flex-1 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < stepIndex
                      ? "bg-emerald-500 text-white"
                      : i === stepIndex
                      ? role === "mitra" ? "bg-lime-600 text-white" : "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}>
                    {i < stepIndex ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-xs font-bold hidden sm:inline ${i === stepIndex ? "text-slate-800" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={`flex-grow h-0.5 rounded-full mx-1 ${i < stepIndex ? "bg-emerald-300" : "bg-slate-100"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">
            {/* Server Errors */}
            {serverErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-red-500 text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  <div>
                    {serverErrors.map((err, i) => (
                      <p key={i} className="text-sm text-red-700">{err}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <p className="text-sm font-bold text-emerald-700">{successMsg}</p>
              </div>
            )}

            {/* ── Step 1: Credentials ── */}
            {step === "credentials" && (
              <>
                <InputField label="Email" type="email" placeholder="contoh@email.com" icon="mail"
                  value={formData.email} onChange={(v) => updateField("email", v)} error={errors.email} />
                <InputField label="Nomor Telepon" type="tel" placeholder="08123456789" icon="phone"
                  value={formData.phone} onChange={(v) => updateField("phone", v.replace(/\D/g, ""))} error={errors.phone}
                  hint="10-15 digit, tanpa spasi atau tanda" />
                <div>
                  <InputField label="Password" type={showPassword ? "text" : "password"} placeholder="Minimal 8 karakter" icon="lock"
                    value={formData.password} onChange={(v) => updateField("password", v)} error={errors.password}
                    suffix={
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <span className="material-symbols-outlined text-lg">{showPassword ? "visibility_off" : "visibility"}</span>
                      </button>
                    } />
                  {formData.password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-grow">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-slate-100"}`} />
                        ))}
                      </div>
                      <span className={`text-[10px] font-bold ${passwordStrength >= 4 ? "text-emerald-600" : passwordStrength >= 3 ? "text-lime-600" : "text-amber-600"}`}>
                        {strengthLabels[passwordStrength - 1] || ""}
                      </span>
                    </div>
                  )}
                </div>
                <InputField label="Konfirmasi Password" type="password" placeholder="Ulangi password" icon="lock"
                  value={formData.confirmPassword} onChange={(v) => updateField("confirmPassword", v)} error={errors.confirmPassword} />
              </>
            )}

            {/* ── Step 2: Personal Info ── */}
            {step === "personal" && (
              <>
                <InputField label="Nama Lengkap" type="text" placeholder="Nama depan & belakang" icon="badge"
                  value={formData.full_name} onChange={(v) => updateField("full_name", v)} error={errors.full_name}
                  hint="Sesuai KTP / identitas resmi" />
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Alamat Lengkap</label>
                  <textarea
                    className={`w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm outline-none transition-all resize-none h-24 border ${
                      errors.address ? "border-red-300 focus:ring-2 focus:ring-red-100" : "border-transparent focus:ring-2 focus:ring-blue-100"
                    }`}
                    placeholder="Jl. Contoh No. 123, Kel. ..."
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.agreeTerms}
                    onChange={(e) => updateField("agreeTerms", e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded-md accent-blue-600 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer leading-relaxed">
                    Saya menyetujui <span className="font-bold text-blue-600 hover:underline">Syarat & Ketentuan</span> dan{" "}
                    <span className="font-bold text-blue-600 hover:underline">Kebijakan Privasi</span> SportTime.
                    Data yang saya berikan adalah benar dan dapat dipertanggungjawabkan.
                  </label>
                </div>
                {errors.agreeTerms && <p className="text-xs text-red-500">{errors.agreeTerms}</p>}
              </>
            )}

            {/* ── Step 3: Mitra Info ── */}
            {step === "mitra_info" && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-500 text-xl shrink-0">info</span>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Data berikut diperlukan untuk <strong>verifikasi identitas mitra</strong> dan proses payout.
                    Admin akan meninjau data Anda sebelum akun diaktifkan.
                  </p>
                </div>
                <InputField label="Nomor KTP (NIK)" type="text" placeholder="16 digit nomor KTP" icon="credit_card"
                  value={formData.ktp_number} onChange={(v) => updateField("ktp_number", v.replace(/\D/g, "").slice(0, 16))} error={errors.ktp_number}
                  hint="Nomor Induk Kependudukan 16 digit" />
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nama Bank</label>
                  <select
                    className={`w-full px-4 py-3 bg-slate-50 rounded-2xl text-sm outline-none transition-all border cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%236f768e%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 ${
                      errors.bank_name ? "border-red-300" : "border-transparent focus:ring-2 focus:ring-blue-100"
                    } ${formData.bank_name ? "text-slate-800" : "text-slate-400"}`}
                    value={formData.bank_name}
                    onChange={(e) => updateField("bank_name", e.target.value)}
                  >
                    <option value="">Pilih bank...</option>
                    {banks.map((b) => (<option key={b} value={b}>{b}</option>))}
                  </select>
                  {errors.bank_name && <p className="text-xs text-red-500 mt-1">{errors.bank_name}</p>}
                </div>
                <InputField label="Nomor Rekening" type="text" placeholder="Nomor rekening bank" icon="account_balance"
                  value={formData.account_number} onChange={(v) => updateField("account_number", v.replace(/\D/g, ""))} error={errors.account_number} />
                <InputField label="Nama Pemilik Rekening" type="text" placeholder="Sesuai buku tabungan" icon="person"
                  value={formData.account_holder} onChange={(v) => updateField("account_holder", v)} error={errors.account_holder}
                  hint="Harus sama dengan nama di buku tabungan" />
              </>
            )}

            {/* ── Action Buttons ── */}
            <div className="flex gap-3 pt-2">
              {step !== "credentials" && (
                <button onClick={prevStep} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors cursor-pointer">
                  Kembali
                </button>
              )}
              {(step === "credentials" || (step === "personal" && role === "mitra")) ? (
                <button onClick={nextStep}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    role === "mitra" ? "bg-lime-600 text-white hover:bg-lime-700 shadow-lg shadow-lime-200" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                  }`}>
                  Lanjut
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 ${
                    role === "mitra" ? "bg-lime-600 text-white hover:bg-lime-700 shadow-lg shadow-lime-200" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                  }`}>
                  {loading && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
                  {loading ? "Mendaftar..." : "Daftar Sekarang"}
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-bold text-blue-600 hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          <span>Data Anda dienkripsi dan dilindungi</span>
        </div>
      </div>
    </div>
  );
}

// ── Reusable Input ──

function InputField({
  label, type, placeholder, icon, value, onChange, error, hint, suffix,
}: {
  label: string; type: string; placeholder: string; icon: string;
  value: string; onChange: (v: string) => void; error?: string; hint?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
      <div className={`flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl transition-all border ${
        error ? "border-red-300 ring-2 ring-red-100" : "border-transparent focus-within:ring-2 focus-within:ring-blue-100"
      }`}>
        <span className="material-symbols-outlined text-slate-400 text-xl">{icon}</span>
        <input
          type={type}
          className="flex-grow bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-800"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={type === "password" ? "new-password" : "off"}
        />
        {suffix}
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
