"use client";

import React from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

export interface FindingCardProps {
  toolName?: string;
  args?: {
    severity?: "critical" | "high" | "medium" | "low" | "info";
    category?: string;
    entity?: string;
    issue?: string;
    action?: string;
    owner?: string;
    evidence?: string;
  };
  argsText?: string;
  result?: any;
  status?: { type: string } | string;
  toolCallId?: string;
}

// ── Severity config ────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    color: "bg-red-500/10 border-red-500/30",
    badge: "bg-red-500/20 text-red-400 ring-red-500/30",
    icon: ShieldAlert,
    label: "Critical",
    accent: "border-l-[#ef4444]",
  },
  high: {
    color: "bg-orange-500/10 border-orange-500/30",
    badge: "bg-orange-500/20 text-orange-400 ring-orange-500/30",
    icon: AlertTriangle,
    label: "High",
    accent: "border-l-[#f97316]",
  },
  medium: {
    color: "bg-amber-500/[0.04] border-amber-500/20",
    badge: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
    icon: AlertTriangle,
    label: "Medium",
    accent: "border-l-[#eab308]",
  },
  low: {
    color: "bg-sky-500/[0.03] border-sky-500/20",
    badge: "bg-sky-500/20 text-sky-400 ring-sky-500/30",
    icon: AlertCircle,
    label: "Low",
    accent: "border-l-[#0ea5e9]",
  },
  info: {
    color: "bg-zinc-500/[0.02] border-zinc-500/20",
    badge: "bg-zinc-500/20 text-zinc-400 ring-zinc-500/30",
    icon: Info,
    label: "Info",
    accent: "border-l-zinc-500/50",
  },
} as const;

function categoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    billing: "\u{1F4B3}",
    tickets: "\u{1F3AB}",
    submissions: "\u{1F4E5}",
    enrollment: "\u{1F4CB}",
    communications: "\u{1F4AC}",
    data_integrity: "\u{1F5C4}",
    general: "\u{1F50D}",
  };
  return map[cat] || "\u{1F50D}";
}

// ── Component ──────────────────────────────────────────────────────

export function FindingCard({ args }: FindingCardProps) {
  const sev = args?.severity || "info";
  const cfg = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.info;
  const Icon = cfg.icon;
  const cat = args?.category || "general";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="my-2"
    >
      <div
        className={cn(
          "jc-card jc-finding relative overflow-hidden rounded-xl",
          "backdrop-blur-md bg-white/[0.03] border border-white/[0.06]",
          "shadow-[0_8px_32px_-12px_rgba(234,179,8,0.06)]",
          // Yellow left border accent — 4px
          "border-l-4 border-l-[#eab308]",
          cfg.color,
        )}
      >
        {/* Header */}
        <div className="relative flex items-center gap-2.5 px-3.5 py-2.5 border-b border-white/[0.04]">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ring-1",
              cfg.badge,
            )}
          >
            <Icon className="size-3" />
            {cfg.label}
          </span>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            {categoryEmoji(cat)} {cat}
          </span>
          {args?.entity && args.entity !== "system" && (
            <span className="ml-auto text-[11px] text-zinc-500 font-medium truncate max-w-[140px]">
              {args.entity}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="relative px-3.5 py-2.5">
          {args?.issue && (
            <div className="text-sm text-zinc-200 font-medium leading-snug">
              {args.issue}
            </div>
          )}
          {args?.action && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[11px] text-emerald-400">
              <span className="text-[10px] opacity-60">{'→'}</span>
              {args.action}
            </div>
          )}
        </div>

        {/* Footer with evidence + owner */}
        {(args?.evidence || args?.owner) && (
          <div className="flex items-center gap-3 px-3.5 py-1.5 border-t border-white/[0.03] bg-white/[0.01]">
            {args?.evidence && (
              <a
                href={args.evidence}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px] hover:text-zinc-300 flex items-center gap-0.5"
              >
                {args.evidence}
                <ExternalLink className="size-2.5 opacity-50" />
              </a>
            )}
            {args?.owner && args.owner !== "unassigned" && (
              <span className="ml-auto text-[10px] text-zinc-600">{args.owner}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default FindingCard;
