"use client";

import React from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

// ── Types ──────────────────────────────────────────────────────────

interface FindingArgs {
  severity?: "critical" | "high" | "medium" | "low" | "info";
  category?: string;
  entity?: string;
  issue?: string;
  action?: string;
  owner?: string;
  evidence?: string;
}

// ── Severity config ────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    color: "border-red-500/40 bg-red-500/10 text-red-400",
    badge: "bg-red-500/20 text-red-400",
    icon: ShieldAlert,
    label: "Critical",
  },
  high: {
    color: "border-orange-500/40 bg-orange-500/10 text-orange-400",
    badge: "bg-orange-500/20 text-orange-400",
    icon: AlertTriangle,
    label: "High",
  },
  medium: {
    color: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    badge: "bg-amber-500/20 text-amber-400",
    icon: AlertTriangle,
    label: "Medium",
  },
  low: {
    color: "border-sky-500/30 bg-sky-500/5 text-sky-400",
    badge: "bg-sky-500/20 text-sky-400",
    icon: AlertCircle,
    label: "Low",
  },
  info: {
    color: "border-zinc-500/30 bg-zinc-500/5 text-zinc-400",
    badge: "bg-zinc-500/20 text-zinc-400",
    icon: Info,
    label: "Info",
  },
} as const;

// ── Category icon ──────────────────────────────────────────────────

function categoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    billing: "💳",
    tickets: "🎫",
    submissions: "📥",
    enrollment: "📋",
    communications: "💬",
    data_integrity: "🗄️",
    general: "🔍",
  };
  return map[cat] || "🔍";
}

// ── Tool UI ────────────────────────────────────────────────────────

export const FindingCard = makeAssistantToolUI<FindingArgs, { ok?: boolean }>({
  toolName: "finding_emitted",
  render: ({ args }) => {
    const sev = args.severity || "info";
    const cfg = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.info;
    const Icon = cfg.icon;
    const cat = args.category || "general";

    return (
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="my-2"
      >
        <div
          className={`relative overflow-hidden rounded-xl border ${cfg.color} backdrop-blur-sm shadow-[0_4px_24px_-12px_rgba(16,185,129,0.06)]`}
        >
          {/* Header */}
          <div className="relative flex items-center gap-2.5 px-3.5 py-2.5 border-b border-white/[0.04]">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${cfg.badge}`}
            >
              <Icon className="size-3" />
              {cfg.label}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              {cat}
            </span>
            {args.entity && args.entity !== "system" && (
              <span className="ml-auto text-[11px] text-zinc-500 font-medium truncate max-w-[140px]">
                {args.entity}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="relative px-3.5 py-2.5">
            {args.issue && (
              <div className="text-sm text-zinc-200 font-medium leading-snug">
                {args.issue}
              </div>
            )}
            {args.action && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[11px] text-emerald-400">
                <span className="text-[10px] opacity-60">→</span>
                {args.action}
              </div>
            )}
          </div>

          {/* Footer with evidence + owner */}
          {(args.evidence || args.owner) && (
            <div className="flex items-center gap-3 px-3.5 py-1.5 border-t border-white/[0.03] bg-white/[0.01]">
              {args.evidence && (
                <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]">
                  {args.evidence}
                </span>
              )}
              {args.owner && args.owner !== "unassigned" && (
                <span className="ml-auto text-[10px] text-zinc-600">
                  {args.owner}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  },
});

export default FindingCard;
