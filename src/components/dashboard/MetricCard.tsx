"use client";

interface MetricCardProps {
  label: string;
  value: number;
  trend: "up" | "down" | "flat";
  icon: string;
  format?: "number" | "currency";
  variant?: "default" | "warning" | "danger";
}

const variantStyles = {
  default: "border-zinc-800/50 text-zinc-100",
  warning: "border-amber-800/40 text-amber-100",
  danger: "border-red-800/40 text-red-100",
};

export default function MetricCard({
  label,
  value,
  trend,
  icon,
  format = "number",
  variant = "default",
}: MetricCardProps) {
  const displayValue =
    format === "currency"
      ? `$${value.toLocaleString()}`
      : value.toLocaleString();

  const trendArrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-red-400"
        : "text-zinc-500";

  return (
    <div
      className={`rounded-xl bg-zinc-900/40 backdrop-blur-md border ${variantStyles[variant]} p-5 hover:border-zinc-700/50 transition-colors`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-zinc-400">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight">
          {displayValue}
        </span>
        <span className={`text-sm ${trendColor}`}>{trendArrow}</span>
      </div>
    </div>
  );
}
