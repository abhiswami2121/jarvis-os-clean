"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Phone,
  Mail,
  MessageSquare,
  Link,
  Wrench,
  Database,
  UserCheck,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

export interface ActionCardProps {
  toolName?: string;
  args?: {
    priority?: number;
    customer?: string;
    action_type?: string;
    description?: string;
    owner?: string;
    deadline?: string;
    evidence?: string;
  };
  argsText?: string;
  result?: any;
  status?: { type: string } | string;
  toolCallId?: string;
}

// ── Priority config ────────────────────────────────────────────────

const PRIORITY_LABELS: Record<number, string> = {
  1: "P1 · Critical",
  2: "P2 · High",
  3: "P3 · Normal",
  4: "P4 · Low",
  5: "P5 · Backlog",
};

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  sms: MessageSquare,
  billing_link: Link,
  mcp_edit: Wrench,
  data_fix: Database,
  follow_up: UserCheck,
};

const ACTION_LABELS: Record<string, string> = {
  call: "Call",
  email: "Email",
  sms: "SMS",
  billing_link: "Billing Link",
  mcp_edit: "Code Edit",
  data_fix: "Data Fix",
  follow_up: "Follow Up",
};

// ── Component ──────────────────────────────────────────────────────

export function ActionCard({ args }: ActionCardProps) {
  const pri = Math.min(Math.max(args?.priority || 3, 1), 5);
  const atype = args?.action_type || "follow_up";
  const ActionIcon = ACTION_ICONS[atype] || UserCheck;
  const actionLabel = ACTION_LABELS[atype] || "Task";

  // Deadline formatting
  let deadlineText = args?.deadline || "ASAP";
  let deadlineUrgent = false;
  if (deadlineText.toLowerCase() === "asap") {
    deadlineUrgent = true;
    deadlineText = "ASAP";
  } else if (/^\d{1,2}h$/i.test(deadlineText)) {
    deadlineUrgent = parseInt(deadlineText) <= 24;
  }

  const priBadgeColor =
    pri <= 2
      ? "bg-red-500/15 text-red-400 ring-red-500/30"
      : pri === 3
        ? "bg-amber-500/15 text-amber-400 ring-amber-500/30"
        : "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="my-2"
    >
      <div
        className={cn(
          "jc-card jc-action relative overflow-hidden rounded-xl",
          "backdrop-blur-md bg-white/[0.03] border border-white/[0.06]",
          "shadow-[0_8px_32px_-12px_rgba(34,197,94,0.06)]",
          // Green left border accent — 4px
          "border-l-4 border-l-[#22c55e]",
        )}
      >
        {/* Header */}
        <div className="relative flex items-center gap-2.5 px-3.5 py-2.5 border-b border-white/[0.04]">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ring-1",
              priBadgeColor,
            )}
          >
            {PRIORITY_LABELS[pri]}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
            <ActionIcon className="size-3" />
            {actionLabel}
          </span>
          {args?.customer && args.customer !== "system" && (
            <span className="ml-auto text-[11px] text-zinc-500 font-medium truncate max-w-[140px]">
              {args.customer}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="relative px-3.5 py-2.5">
          {args?.description && (
            <div className="text-sm text-zinc-200 leading-snug">
              {args.description}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            {deadlineText && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono",
                  deadlineUrgent
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    : "bg-zinc-500/10 text-zinc-400 border border-white/[0.05]",
                )}
              >
                <Clock className="size-2.5" />
                {deadlineText}
              </span>
            )}
            {args?.owner && args.owner !== "unassigned" && (
              <span className="ml-auto text-[10px] text-zinc-600">
                {args.owner}
              </span>
            )}
          </div>
        </div>

        {/* Evidence footer */}
        {args?.evidence && (
          <div className="px-3.5 py-1.5 border-t border-white/[0.03] bg-white/[0.01]">
            <a
              href={args.evidence}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-zinc-500 font-mono truncate flex items-center gap-0.5 hover:text-zinc-300"
            >
              {args.evidence}
              <ExternalLink className="size-2.5 opacity-50" />
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ActionCard;
