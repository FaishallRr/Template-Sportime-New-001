"use client";

import { useToast } from "./DashboardContext";

const toastConfig = {
  success: { icon: "check_circle", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", iconColor: "text-emerald-500" },
  error: { icon: "error", bg: "bg-red-50 border-red-200", text: "text-red-800", iconColor: "text-red-500" },
  warning: { icon: "warning", bg: "bg-amber-50 border-amber-200", text: "text-amber-800", iconColor: "text-amber-500" },
  info: { icon: "info", bg: "bg-blue-50 border-blue-200", text: "text-blue-800", iconColor: "text-blue-500" },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => {
        const cfg = toastConfig[toast.type];
        return (
          <div
            key={toast.id}
            className={`${cfg.bg} border rounded-2xl p-4 shadow-xl animate-[slideUp_0.3s_ease-out] flex items-start gap-3`}
          >
            <span
              className={`material-symbols-outlined ${cfg.iconColor} text-xl shrink-0 mt-0.5`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {cfg.icon}
            </span>
            <div className="flex-grow min-w-0">
              <p className={`text-sm font-bold ${cfg.text}`}>{toast.title}</p>
              {toast.message && (
                <p className={`text-xs ${cfg.text} opacity-70 mt-0.5`}>
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className={`${cfg.text} opacity-40 hover:opacity-70 transition-opacity cursor-pointer shrink-0`}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
