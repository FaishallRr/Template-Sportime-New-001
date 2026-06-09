"use client";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
}

export default function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-slate-300">
          {icon}
        </span>
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {action.icon && (
            <span className="material-symbols-outlined text-lg">
              {action.icon}
            </span>
          )}
          {action.label}
        </button>
      )}
    </div>
  );
}
