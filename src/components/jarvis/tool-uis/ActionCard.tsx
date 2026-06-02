"use client";

import React from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  Phone, Mail, MessageSquare, Link, Wrench, Database,
  UserCheck, Clock, ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";

// ── Types ──────────────────────────────────────────────────────────

interface ActionArgs {
  priority?: number;      // 1 (highest) - 5 (lowest)
  customer?: string;
  action_type?: string;   // call|email|sms|billing_link|mcp_edit|data_fix|follow_up
  description?: string;
  owner?: string;
  deadline?: string;      // ISO, 'ASAP', or relative like '48h'
  evidence?: string;
}

// ── Priority config ────────────────────────────────────────────────

const PRIORITY_COLORS: Record<number, string> = {
  1: "border-red-500/40 bg-red-500/10 text-red-400",
  2: "border-orange-500/40 bg-orange-500/10 text-orange-400",
  3: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  4: "border-sky-500/30 bg-sky-500/5 text-sky-400",
  5: "border-zinc-500/30 bg-zinc-500/5 text-zinc-400",
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "P1 · Critical",
  2: "P2 · High",
  3: "P3 · Normal",
  4: "P4 · Low",
  5: "P5 · Backlog",
};

// ── Action type icon ───────────────────────────────────────────────

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

// ── Tool UI ────────────────────────────────────────────────────────

export const ActionCard = makeAssistantToolUI<ActionArgs, { ok?: boolean }>({
  toolName: "action_emitted",
  render: ({ args }) => {
    const pri = Math.min(Math.max(args.priority || 3, 1), 5);
    const priColor = PRIORITY_COLORS[pri] || PRIORITY_COLORS[3];
    const atype = args.action_type || "follow_up";
    const ActionIcon = ACTION_ICONS[atype] || UserCheck;
    const actionLabel = ACTION_LABELS[atype] || "Task";

    // Deadline formatting
    let deadlineText = args.deadline || "ASAP";
    let deadlineUrgent = false;
    if (deadlineText.toLowerCase() === "asap") {
      deadlineUrgent = true;
      deadlineText = "ASAP";
    } else if (/^\d{1,2}h$/i.test(deadlineText)) {
      deadlineUrgent = parseInt(deadlineText) <= 24;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="my-2"
      >
        <div
          className={`relative overflow-hidden rounded-xl border ${priColor} backdrop-blur-sm shadow-[0_4px_24px_-12px_rgba(16,185,129,0.06)]`}
        >
          {/* Header: Priority badge + action type + customer */}
          <div className="relative flex items-center gap-2.5 px-3.5 py-2.5 border-b border-white/[0.04]">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                pri <= 2
                  ? "bg-red-500/15 text-red-400"
                  : pri === 3
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-zinc-500/15 text-zinc-400"
              }`}
            >
              {PRIORITY_LABELS[pri]}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
              <ActionIcon className="size-3" />
              {actionLabel}
            </span>
            {args.customer && args.customer !== "system" && (
              <span className="ml-auto text-[11px] text-zinc-500 font-medium truncate max-w-[140px]">
                {args.customer}
              </span>
            )}
          </div>

          {/* Body: Description */}
          <div className="relative px-3.5 py-2.5">
            {args.description && (
              <div className="text-sm text-zinc-200 leading-snug">
                {args.description}
              </div>
            )}
            <div className="flex items-center gap-3 mt-2">
              {/* Deadline pill */}
              {deadlineText && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono ${
                    deadlineUrgent
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                      : "bg-zinc-500/10 text-zinc-400 border border-white/[0.05]"
                  }`}
                >
                  <Clock className="size-2.5" />
                  {deadlineText}
                </span>
              )}
              {/* Owner pill */}
              {args.owner && args.owner !== "unassigned" && (
                <span className="ml-auto text-[10px] text-zinc-600">
                  {args.owner}
                </span>
              )}
            </div>
          </div>

          {/* Evidence footer */}
          {args.evidence && (
            <div className="px-3.5 py-1.5 border-t border-white/[0.03] bg-white/[0.01]">
              <span className="text-[10px] text-zinc-500 font-mono truncate block">
                {args.evidence}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  },
});

export default ActionCard;
