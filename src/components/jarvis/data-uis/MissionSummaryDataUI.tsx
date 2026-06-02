"use client";

import React from "react";
import { makeAssistantDataUI } from "@assistant-ui/react";
import { CheckCircle2, TrendingUp, Clock, Activity, Zap } from "lucide-react";
import { motion } from "motion/react";

// ── Types ──────────────────────────────────────────────────────────

interface MissionSummaryData {
  title?: string;
  summary?: string;
  metrics?: Record<string, string | number>;
  status?: "success" | "partial" | "failed";
}

// ── Metric icon map ────────────────────────────────────────────────

const METRIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  duration: Clock,
  tokens: Zap,
  files: Activity,
  deployments: TrendingUp,
};

// ── Data UI ────────────────────────────────────────────────────────

export const MissionSummaryDataUI = makeAssistantDataUI<MissionSummaryData>({
  name: "mission_summary",
  render: ({ data }) => {
    if (!data) return null;

    const statusColor =
      data.status === "failed"
        ? "border-red-500/30 bg-red-500/5 text-red-300"
        : data.status === "partial"
          ? "border-amber-500/30 bg-amber-500/5 text-amber-300"
          : "border-emerald-500/30 bg-emerald-500/5 text-emerald-300";

    const iconColor =
      data.status === "failed"
        ? "text-red-400"
        : data.status === "partial"
          ? "text-amber-400"
          : "text-emerald-400";

    const metrics = data.metrics || {};
    const hasMetrics = Object.keys(metrics).length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="my-4"
      >
        <div
          className={`relative overflow-hidden rounded-xl border ${statusColor} backdrop-blur-sm`}
        >
          {/* Ambient glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br from-emerald-400/8 to-cyan-500/5" />

          <div className="relative px-5 py-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 ${iconColor}`}>
                <CheckCircle2 className="size-4" />
              </span>
              <div>
                <div className={`font-semibold text-lg ${statusColor}`}>
                  {data.title || "Mission Complete"}
                </div>
                {data.status && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                    {data.status}
                  </span>
                )}
              </div>
            </div>

            {/* Metrics grid */}
            {hasMetrics && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {Object.entries(metrics).map(([key, value]) => {
                  const Icon = METRIC_ICONS[key.toLowerCase()] || Activity;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2.5"
                    >
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Icon className="size-3" />
                        {key}
                      </span>
                      <span className="text-sm text-zinc-100 font-mono font-medium">
                        {String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary text */}
            {data.summary && (
              <div className="mt-3 text-sm text-zinc-400 leading-relaxed">
                {data.summary}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  },
});

export default MissionSummaryDataUI;
