"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  Wrench,
  Rocket,
  Pencil,
  Database,
  Search,
  Send,
  Globe,
  FileText,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

type SimpleStatus = "running" | "complete" | "incomplete" | "requires-action";

export interface ToolCallCardProps {
  toolName: string;
  args?: Record<string, any>;
  argsText?: string;
  result?: any;
  status: { type: SimpleStatus } | SimpleStatus;
  toolCallId?: string;
}

// ── Status config ──────────────────────────────────────────────────

const statusMeta: Record<
  SimpleStatus,
  { icon: React.ElementType; color: string; ring: string; bg: string; badge: string; label: string }
> = {
  running: {
    icon: Loader2,
    color: "text-amber-400",
    ring: "ring-amber-500/30",
    bg: "bg-amber-500/[0.04]",
    badge: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    label: "Running",
  },
  complete: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    ring: "ring-emerald-500/25",
    bg: "bg-emerald-500/[0.03]",
    badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    label: "Complete",
  },
  incomplete: {
    icon: XCircle,
    color: "text-red-400",
    ring: "ring-red-500/40",
    bg: "bg-red-500/[0.04]",
    badge: "bg-red-500/15 text-red-300 ring-red-500/40",
    label: "Error",
  },
  "requires-action": {
    icon: AlertCircle,
    color: "text-sky-400",
    ring: "ring-sky-500/30",
    bg: "bg-sky-500/[0.04]",
    badge: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
    label: "Action",
  },
};

// ── Tool kind detection ────────────────────────────────────────────

function toolKindMeta(toolName: string): {
  icon: React.ElementType;
  label: string;
  accent: string;
} {
  const n = (toolName || "").toLowerCase();
  const has = (...k: string[]) => k.some((s) => n.includes(s));
  if (has("deploy", "build", "vercel", "run_command", "exec", "shell", "bash"))
    return { icon: Rocket, label: "Deploy", accent: "text-orange-400" };
  if (has("delete", "remove", "destroy"))
    return { icon: Trash2, label: "Delete", accent: "text-red-400" };
  if (has("write", "edit", "create", "update", "replace", "save", "patch"))
    return { icon: Pencil, label: "Edit", accent: "text-emerald-400" };
  if (has("query", "sql", "filter", "entit", "db", "database", "select"))
    return { icon: Database, label: "Query", accent: "text-purple-400" };
  if (has("search", "grep", "find", "web", "perplex", "google"))
    return { icon: Search, label: "Search", accent: "text-cyan-400" };
  if (has("slack", "email", "sms", "send", "message", "notify"))
    return { icon: Send, label: "Send", accent: "text-sky-400" };
  if (has("fetch", "http", "url", "browse"))
    return { icon: Globe, label: "Fetch", accent: "text-teal-400" };
  if (has("read", "get", "list", "view", "cat", "lookup", "load"))
    return { icon: FileText, label: "Read", accent: "text-blue-400" };
  return { icon: Wrench, label: "Tool", accent: "text-zinc-400" };
}

// ── Args summarizer ────────────────────────────────────────────────

function summarizeArgs(args: any, max = 64): string {
  if (!args) return "";
  if (typeof args === "string") return args.slice(0, max);
  try {
    const keys = Object.keys(args);
    if (keys.length === 0) return "";
    const pairs = keys.slice(0, 2).map((k) => {
      const v = args[k];
      const vStr = typeof v === "string" ? `"${v.slice(0, 24)}"` : JSON.stringify(v).slice(0, 28);
      return `${k}=${vStr}`;
    });
    let s = pairs.join(", ");
    if (keys.length > 2) s += ` +${keys.length - 2}`;
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  } catch {
    return "";
  }
}

function resultPreview(result: any): string {
  if (result === undefined || result === null) return "";
  const text = typeof result === "string" ? result : JSON.stringify(result);
  if (text.length <= 200) return text;
  return text.slice(0, 197) + "…";
}

// ── Component ──────────────────────────────────────────────────────

export function ToolCallCard({
  toolName,
  args,
  argsText,
  result,
  status,
}: ToolCallCardProps) {
  const sType: SimpleStatus =
    typeof status === "string" ? status : status?.type ?? "complete";
  const meta = statusMeta[sType];
  const Icon = meta.icon;
  const isRunning = sType === "running";
  const isError = sType === "incomplete";
  const isComplete = sType === "complete";

  const [open, setOpen] = useState(isRunning);
  React.useEffect(() => {
    if (!isRunning) setOpen(false);
  }, [isRunning]);

  const argSummary = summarizeArgs(args);
  const cleanName = toolName.replace(/^mcp__base44_tools__/, "").replace(/^mcp__/, "");
  const kind = toolKindMeta(toolName);
  const KindIcon = kind.icon;
  const preview = isComplete || isError ? resultPreview(result) : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="my-2"
    >
      <div
        className={cn(
          // Aurora glass card base
          "jc-card jc-tool-call relative overflow-hidden rounded-xl",
          "backdrop-blur-md bg-white/[0.04] border border-white/[0.08]",
          "shadow-[0_8px_32px_-12px_rgba(59,130,246,0.06)]",
          // Status ring accent
          meta.ring,
          meta.bg,
          isError && "border-red-500/30",
        )}
      >
        {/* ── Header row ── */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
        >
          {/* Status icon */}
          <Icon
            className={cn(
              "size-3.5 flex-shrink-0",
              meta.color,
              isRunning && "animate-spin",
            )}
          />

          {/* Tool kind icon */}
          <span className={cn("inline-flex items-center justify-center size-5 rounded-md bg-white/[0.06] flex-shrink-0")}>
            <KindIcon className={cn("size-3", kind.accent)} />
          </span>

          {/* Tool kind label */}
          <span className={cn("text-[10px] font-semibold uppercase tracking-wider flex-shrink-0", kind.accent)}>
            {kind.label}
          </span>

          {/* Tool name */}
          <span className="text-[11px] font-mono text-zinc-400 truncate flex-1 min-w-0">
            {cleanName}
          </span>

          {/* Arg summary */}
          {argSummary && (
            <span className="text-[10px] font-mono text-zinc-600 truncate max-w-[180px] hidden sm:inline">
              {argSummary}
            </span>
          )}

          {/* Status badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 ring-1",
              meta.badge,
            )}
          >
            {meta.label}
          </span>

          {/* Chevron */}
          <ChevronDown
            className={cn(
              "size-3 text-zinc-600 transition-transform duration-200 flex-shrink-0",
              open ? "rotate-0" : "-rotate-90",
            )}
          />
        </button>

        {/* ── Expanded detail ── */}
        {open && (
          <div className="px-3.5 pb-3 space-y-2.5 border-t border-white/[0.04]">
            {/* Args */}
            {(args || argsText) && (
              <div>
                <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1 font-semibold">
                  Arguments
                </div>
                <pre className="text-[10px] font-mono text-zinc-400 bg-[#0a0a0f]/60 rounded-md p-2.5 overflow-x-auto max-h-36 leading-relaxed border border-white/[0.05]">
                  {JSON.stringify(args ?? argsText, null, 2)}
                </pre>
              </div>
            )}

            {/* Result */}
            {result !== undefined && result !== null && (
              <div>
                <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1 font-semibold">
                  {isError ? "Error Detail" : "Result"}
                </div>
                <pre
                  className={cn(
                    "text-[10px] font-mono rounded-md p-2.5 overflow-x-auto max-h-52 leading-relaxed whitespace-pre-wrap border",
                    isError
                      ? "bg-red-950/20 border-red-500/20 text-red-300"
                      : "bg-[#0a0a0f]/60 border-white/[0.05] text-zinc-400",
                  )}
                >
                  {typeof result === "string" ? result.slice(0, 2500) : JSON.stringify(result, null, 2).slice(0, 2500)}
                </pre>
              </div>
            )}

            {/* Error hint */}
            {isError && (
              <div className="flex items-center gap-2 rounded-md bg-red-500/[0.06] border border-red-500/10 px-2.5 py-2">
                <AlertCircle className="size-3.5 text-red-400 flex-shrink-0" />
                <span className="text-[10px] text-red-300">
                  This tool call failed. The agent may retry or ask for clarification.
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Result preview (collapsed, when done) ── */}
        {preview && !open && (
          <div
            className={cn(
              "px-3.5 pb-2 border-t",
              isError ? "border-red-500/10" : "border-white/[0.03]",
            )}
          >
            <div
              className={cn(
                "text-[10px] font-mono leading-relaxed line-clamp-2 mt-2",
                isError ? "text-red-400/70" : "text-emerald-400/70",
              )}
            >
              {preview}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ToolCallCard;
