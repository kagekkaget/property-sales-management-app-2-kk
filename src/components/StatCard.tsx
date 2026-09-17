interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "amber" | "red" | "purple" | "orange";
  trend?: { value: number; label: string };
}

const colors = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-500",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  green: {
    bg: "bg-green-50",
    icon: "bg-green-500",
    text: "text-green-600",
    border: "border-green-100",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-500",
    text: "text-amber-600",
    border: "border-amber-100",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-500",
    text: "text-red-600",
    border: "border-red-100",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-500",
    text: "text-purple-600",
    border: "border-purple-100",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "bg-orange-500",
    text: "text-orange-600",
    border: "border-orange-100",
  },
};

export default function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  const c = colors[color];
  return (
    <div className={`bg-white rounded-2xl p-6 border ${c.border} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${trend.value >= 0 ? "text-green-600" : "text-red-600"}`}>
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-slate-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`${c.icon} p-3 rounded-xl shadow-sm`}>
          <div className="text-white w-6 h-6">{icon}</div>
        </div>
      </div>
    </div>
  );
}
