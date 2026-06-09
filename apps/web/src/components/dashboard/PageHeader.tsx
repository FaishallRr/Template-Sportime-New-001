"use client";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-slate-600 text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {icon}
            </span>
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
