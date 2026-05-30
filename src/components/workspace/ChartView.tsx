"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Artifact, DataTableArtifact as DataTableArtifactType, ChartArtifact as ChartArtifactType, StatusCardArtifact as StatusCardArtifactType } from "@/lib/artifacts/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ── Props ─────────────────────────────────────────────────────────

interface ChartViewProps {
  artifact: Artifact;
  className?: string;
}

// ── Simple SVG Chart Renderer ─────────────────────────────────────

function SimpleBarChart({ data, xKey, yKey, title }: { data: Record<string, any>[]; xKey: string; yKey: string; title: string }) {
  const maxY = Math.max(...data.map((d) => Number(d[yKey]) || 0), 1);
  const chartHeight = 200;
  const chartWidth = 100; // percentage

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-zinc-100 mb-4">{title}</h3>
      <div className="flex items-end gap-2 h-[200px]">
        {data.map((d, i) => {
          const val = Number(d[yKey]) || 0;
          const height = (val / maxY) * chartHeight;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span className="text-[10px] text-zinc-400 tabular-nums">
                {val.toLocaleString()}
              </span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-emerald-500/60 to-emerald-400/80 hover:from-emerald-400/80 hover:to-emerald-300/90 transition-all cursor-pointer"
                style={{ height: `${Math.max(height, 2)}px` }}
                title={`${d[xKey]}: ${val}`}
              />
              <span className="text-[9px] text-zinc-500 truncate max-w-full">
                {String(d[xKey]).slice(0, 8)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SimpleLineChart({ data, xKey, yKey, title }: { data: Record<string, any>[]; xKey: string; yKey: string; title: string }) {
  const maxY = Math.max(...data.map((d) => Number(d[yKey]) || 0), 1);
  const minY = Math.min(...data.map((d) => Number(d[yKey]) || 0), 0);
  const range = maxY - minY || 1;
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 100;
    const y = 100 - ((Number(d[yKey]) || 0) - minY) / range * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-zinc-100 mb-2">{title}</h3>
      <div className="relative h-[200px]">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
          ))}
          {/* Area fill */}
          <polygon
            points={`0,100 ${points} 100,100`}
            fill="url(#lineGrad)"
            opacity="0.15"
          />
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="url(#lineStroke)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10D9A0" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10D9A0" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10D9A0" />
              <stop offset="100%" stopColor="#06D9F0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between mt-1">
        {data.length > 12
          ? data.filter((_, i) => i % Math.ceil(data.length / 8) === 0).map((d, i) => (
              <span key={i} className="text-[9px] text-zinc-500">{String(d[xKey]).slice(0, 6)}</span>
            ))
          : data.map((d, i) => (
              <span key={i} className="text-[9px] text-zinc-500">{String(d[xKey]).slice(0, 6)}</span>
            ))}
      </div>
    </div>
  );
}

// ── Metric Cards ──────────────────────────────────────────────────

function MetricCards({ artifact }: { artifact: StatusCardArtifactType }) {
  const statusColors: Record<string, string> = {
    healthy: "border-emerald-500/20 bg-emerald-500/[0.04]",
    warning: "border-amber-500/20 bg-amber-500/[0.04]",
    critical: "border-red-500/20 bg-red-500/[0.04]",
    unknown: "border-zinc-500/20 bg-zinc-500/[0.04]",
  };

  const TrendIcon = ({ trend }: { trend?: string }) => {
    if (trend === "up") return <TrendingUp className="size-3 text-emerald-400" />;
    if (trend === "down") return <TrendingDown className="size-3 text-red-400" />;
    return <Minus className="size-3 text-zinc-500" />;
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <div
          className={cn(
            "px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase",
            statusColors[artifact.status] || statusColors.unknown
          )}
        >
          {artifact.status}
        </div>
        <h3 className="text-sm font-semibold text-zinc-100">{artifact.title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {artifact.metrics.map((metric, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all"
          >
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
              {metric.label}
            </p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-zinc-100 tabular-nums">
                {metric.format === "currency"
                  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(metric.value))
                  : metric.format === "percent"
                  ? `${Number(metric.value).toFixed(1)}%`
                  : String(metric.value)}
              </span>
              {metric.trend && <TrendIcon trend={metric.trend} />}
            </div>
            {metric.trendValue && (
              <p className={cn(
                "text-[10px] mt-0.5",
                metric.trend === "up" ? "text-emerald-400" : metric.trend === "down" ? "text-red-400" : "text-zinc-500"
              )}>
                {metric.trendValue}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

export function ChartView({ artifact, className }: ChartViewProps) {
  const content = useMemo(() => {
    // Status card → metric cards
    if (artifact.type === "status_card") {
      return <MetricCards artifact={artifact as StatusCardArtifactType} />;
    }

    // Chart type
    if (artifact.type === "chart") {
      const chart = artifact as ChartArtifactType;
      const xKey = chart.axisLabels?.x || Object.keys(chart.data[0] || {})[0] || "x";
      const yKey = chart.axisLabels?.y || Object.keys(chart.data[0] || {})[1] || "y";

      if (chart.chartType === "line") {
        return <SimpleLineChart data={chart.data} xKey={xKey} yKey={yKey} title={chart.title} />;
      }
      return <SimpleBarChart data={chart.data} xKey={xKey} yKey={yKey} title={chart.title} />;
    }

    // Generic
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-sm text-zinc-500">Chart view not available for this artifact type</p>
      </div>
    );
  }, [artifact]);

  return (
    <div className={cn("h-full overflow-auto", className)}>
      {content}
    </div>
  );
}

export default ChartView;
