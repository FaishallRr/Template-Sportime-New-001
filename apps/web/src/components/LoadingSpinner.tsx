"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({
  size = "md",
  text,
  fullPage = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <span
        className={`material-symbols-outlined animate-spin text-primary ${sizeClasses[size]}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        progress_activity
      </span>
      {text && (
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        {spinner}
      </div>
    );
  }

  return spinner;
}
