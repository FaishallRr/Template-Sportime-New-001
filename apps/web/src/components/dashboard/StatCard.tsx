interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  iconBg?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  trend,
  trendUp,
  iconBg = "bg-blue-50 text-blue-600",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
              trendUp
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {trendUp ? "trending_up" : "trending_down"}
            </span>
            {trend}
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-slate-900 tracking-tight mb-1">
        {value}
      </p>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
    </div>
  );
}
