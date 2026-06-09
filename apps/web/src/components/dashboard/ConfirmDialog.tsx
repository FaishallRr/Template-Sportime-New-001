"use client";

import { useEffect, useCallback } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    },
    [open, onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  const variantStyles = {
    danger: {
      icon: "warning",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      btn: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
      icon: "help",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      btn: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    info: {
      icon: "info",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      btn: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  };

  const v = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-[scaleIn_0.2s_ease-out]">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className={`w-16 h-16 rounded-2xl ${v.iconBg} flex items-center justify-center`}
          >
            <span
              className={`material-symbols-outlined text-3xl ${v.iconColor}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {v.icon}
            </span>
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-500 text-center leading-relaxed mb-8">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-6 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${v.btn}`}
          >
            {loading && (
              <span className="material-symbols-outlined text-base animate-spin">
                progress_activity
              </span>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
