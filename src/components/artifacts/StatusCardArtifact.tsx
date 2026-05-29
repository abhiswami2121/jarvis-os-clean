"use client";

import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Minus, Activity, ShieldCheck, ShieldAlert, ShieldOff, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusCardArtifact as StatusCardArtifactType, MetricTile } from "@/lib/artifacts/types";

// ── Status Config ───────────────────────────────────────────────
const STATUS_CONFIG = {
  healthy: {
    icon: ShieldCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    ring: "ring-emerald-500/15",
    label: "Healthy",
  },
  warning: {
    icon: ShieldAlert,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    ring: "ring-amber-500/15",
    label: "Warning",
  },
  critical: {
    icon: ShieldOff,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    ring: "ring-red-500/15",
    label: "Critical",
  },
  unknown: {
    icon: HelpCircle,
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/20",
    ring: "ring-zinc-500/15",
    label: "Unknown",
  },
} as const;

// ── Metric Formatting ───────────────────────────────────────────
function formatMetricValue(value: string | number, format: MetricTile["format"]): string {
  const n = Number(value);
  switch (format) {
    case "currency":
      if (isNaN(n)) return String(value);
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
    case "number":
      if (isNaN(n)) return String(value);
      return new Intl.NumberFormat("en-US").format(n);
    case "percent":
      if (isNaN(n)) return String(value);
      return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
    default:
      return String(value);
  }
}

// ── Trend Icon ───────────────────────────────────────────────────
function TrendIcon({ trend, trendValue }: { trend?: MetricTile["trend"]; trendValue?: string }) {
  if (!trend) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      {trend === "up" && <TrendingUp className="size-3 flex-shrink-0 text-emerald-400" />}
      {trend === "down" && <TrendingDown className="size-3 flex-shrink-0 text-red-400" />}
      {trend === "flat" && <Minus className="size-3 flex-shrink-0 text-zinc-500" />}
      {trendValue && (
        <span
          className={cn(
            "text-[10px] font-medium",
            trend === "up" && "text-emerald-400",
            trend === "down" && "text-red-400",
            trend === "flat" && "text-zinc-500"
          )}
        >
          {trendValue}
        </span>
      )}
    </span>
  );
}

// ── Main Component ──────────────────────────────────────────────
interface StatusCardArtifactProps {
  artifact: StatusCardArtifactType;
  className?: string;
}

export function StatusCardArtifact({ artifact, className }: StatusCardArtifactProps) {
  const { title, status, metrics } = artifact;
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "my-3 overflow-hidden rounded-xl border bg-white/[0.02] backdrop-blur-sm",
        config.border,
        "ring-1",
        config.ring
      )}
    >
      {/* ── Header ── */}
      <div className="min-h-[120px] flex items-center gap-2.5 border-b border-white/[0.04] px-4 py-3">
        <div className={cn("flex size-7 items-center justify-center rounded-lg border", config.bg, config.border)}>
          <StatusIcon className={cn("size-3.5", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100 truncate">{title}</h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            config.bg,
            config.border,
            config.color
          )}
        >
          <Activity className="size-2.5" />
          {config.label}
        </span>
      </div>

      {/* ── Metric Grid ── */}
      <div className={cn("grid gap-3 p-4", metrics.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: i * 0.04 }}
            className="rounded-lg border border-white/[0.05] bg-white/[0.01] p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                {metric.label}
              </span>
              <TrendIcon trend={metric.trend} trendValue={metric.trendValue} />
            </div>
            <div className="text-lg font-bold text-zinc-100 tabular-nums">
              {formatMetricValue(metric.value, metric.format)}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default StatusCardArtifact;
