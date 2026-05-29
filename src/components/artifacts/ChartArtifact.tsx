"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { BarChart3, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartArtifact as ChartArtifactType } from "@/lib/artifacts/types";

// ── Chart Type Icons ────────────────────────────────────────────
const CHART_META = {
  line: { icon: TrendingUp, label: "Line Chart" },
  bar: { icon: BarChart3, label: "Bar Chart" },
  pie: { icon: BarChart3, label: "Pie Chart" },
} as const;

// ── Main Component ──────────────────────────────────────────────
interface ChartArtifactProps {
  artifact: ChartArtifactType;
  className?: string;
}

export function ChartArtifact({ artifact, className }: ChartArtifactProps) {
  const { title, chartType, data, axisLabels, subtitle } = artifact;
  const meta = CHART_META[chartType];
  const ChartIcon = meta.icon;

  // Derive columns from first data item
  const columns = useMemo(() => {
    if (!data.length) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Compute max bar height for bar chart visual
  const maxVal = useMemo(() => {
    if (chartType !== "bar" || !columns.length) return 1;
    const yKey = axisLabels?.y || columns[1] || columns[0];
    let max = 0;
    for (const row of data) {
      const v = Number(row[yKey]);
      if (!isNaN(v) && v > max) max = v;
    }
    return max || 1;
  }, [chartType, columns, axisLabels, data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "my-3 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm",
        className
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.04] px-4 py-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
          <ChartIcon className="size-3.5 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100 truncate">{title}</h3>
          {subtitle && <p className="text-[11px] text-zinc-500">{subtitle}</p>}
        </div>
        <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300">
          {meta.label}
        </span>
      </div>

      {/* ── Chart Visual (stub) ── */}
      <div className="p-4">
        {chartType === "bar" && columns.length >= 2 && data.length > 0 && (
          <div className="flex items-end gap-1.5 h-32 mb-3">
            {data.slice(0, 40).map((row, i) => {
              const yKey = axisLabels?.y || columns[1];
              const xLabel = axisLabels?.x || columns[0];
              const value = Number(row[yKey]);
              const heightPct = isNaN(value) ? 0 : Math.max(2, (value / maxVal) * 100);
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end group"
                  title={`${row[xLabel]}: ${value}`}
                >
                  <div
                    className="w-full rounded-sm bg-gradient-to-t from-purple-500/60 to-purple-400/80 transition-all hover:from-purple-500/80 hover:to-purple-400 min-h-[2px]"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {chartType === "pie" && data.length > 0 && (
          <div className="flex items-center justify-center gap-4 py-4 flex-wrap">
            {data.slice(0, 10).map((row, i) => {
              const label = columns[0] ? String(row[columns[0]] || "?") : `Item ${i+1}`;
              const value = columns[1] ? Number(row[columns[1]]) : 0;
              const hues = ["#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];
              const color = hues[i % hues.length];
              return (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <span className="size-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-zinc-300">{label}</span>
                  <span className="text-zinc-500 tabular-nums">{value}</span>
                </div>
              );
            })}
          </div>
        )}

        {chartType === "line" && data.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <svg viewBox={`0 0 ${Math.min(data.length * 12, 400)} 64`} className="w-full h-16" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="rgb(168 85 247 / 0.6)"
                strokeWidth="1.5"
                points={data.map((row, i) => {
                  const yKey = axisLabels?.y || columns[1];
                  const value = Number(row[yKey]);
                  const x = (i / Math.max(data.length - 1, 1)) * (Math.min(data.length * 12, 400));
                  const y = isNaN(value) || maxVal === 0 ? 32 : 60 - ((value / maxVal) * 56);
                  return `${x},${Math.max(4, y)}`;
                }).join(" ")}
              />
            </svg>
          </div>
        )}

        {/* ── Data Table (always shown) ── */}
        {data.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-white/[0.04]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.02] last:border-0">
                    {columns.map((col) => (
                      <td key={col} className="px-3 py-1.5 text-[11px] text-zinc-300 font-mono tabular-nums">
                        {row[col] != null ? String(row[col]) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 20 && (
              <div className="px-3 py-1.5 text-[10px] text-zinc-600 border-t border-white/[0.02]">
                + {data.length - 20} more rows
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ChartArtifact;
