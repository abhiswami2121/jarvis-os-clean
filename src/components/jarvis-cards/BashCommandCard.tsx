"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Terminal, ChevronDown, ChevronRight, Check, X, Loader2, Copy, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

export interface BashCommandCardProps {
  toolName?: string;
  args?: {
    cmd?: string;
    cwd?: string;
    tool_id?: string;
    exit_code?: number;
    output_preview?: string;
    duration_ms?: number;
    command?: string;
    output?: string;
  };
  argsText?: string;
  result?: any;
  status?: { type: string } | string;
  toolCallId?: string;
}

// ── Component ──────────────────────────────────────────────────────

export function BashCommandCard({ args, result, status }: BashCommandCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const cmd = args?.cmd || args?.command || "";
  const output = args?.output_preview || args?.output || (typeof result === "string" ? result : "");
  const exitCode = args?.exit_code;
  const isRunning = exitCode === undefined || exitCode === null;
  const isSuccess = exitCode === 0;
  const isError = exitCode !== undefined && exitCode !== 0;
  const lines = output.split("\n").length;
  const shouldCollapse = !expanded && lines > 10;

  const handleCopy = async () => {
    try {
      const text = `${cmd ? "$ " + cmd + "\n" : ""}${output}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="my-2"
    >
      <div
        className={cn(
          "jc-card jc-bash relative overflow-hidden rounded-xl",
          "bg-[#0a0a0f]/90 border border-zinc-700/40",
          "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)]",
        )}
      >
        {/* Command header */}
        <div className="relative flex items-center gap-2 px-3.5 py-2.5 border-b border-white/[0.04]">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
            <Terminal className="size-3.5" />
          </span>

          {/* Status indicator */}
          <span className="shrink-0">
            {isRunning && <Loader2 className="size-3.5 text-amber-400 animate-spin" />}
            {isSuccess && <Check className="size-3.5 text-emerald-400" />}
            {isError && <X className="size-3.5 text-red-400" />}
          </span>

          {/* Command text */}
          <code className="flex-1 min-w-0 text-xs font-mono text-zinc-300 truncate">
            <span className="text-emerald-400/70 select-none mr-1">$</span>
            {cmd}
          </code>

          {/* Duration */}
          {args?.duration_ms != null && (
            <span className="text-[10px] font-mono text-zinc-600">
              {(args.duration_ms / 1000).toFixed(1)}s
            </span>
          )}

          {/* Copy button */}
          {(cmd || output) && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="shrink-0 p-1 rounded hover:bg-white/[0.06] transition-colors"
              aria-label="Copy command output"
            >
              {copied ? (
                <CheckCheck className="size-3 text-emerald-400" />
              ) : (
                <Copy className="size-3 text-zinc-600 hover:text-zinc-400" />
              )}
            </button>
          )}
        </div>

        {/* Output area */}
        {output && (
          <>
            <div
              className={cn(
                "relative overflow-hidden transition-all",
                shouldCollapse ? "max-h-52" : "",
              )}
            >
              <pre
                className={cn(
                  "px-3.5 py-2.5 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all",
                  isError ? "text-red-300/80" : "text-zinc-400/80",
                )}
              >
                {output}
              </pre>

              {/* Fade out when collapsed */}
              {shouldCollapse && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
              )}
            </div>

            {/* Expand/collapse toggle */}
            {lines > 10 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 w-full px-3.5 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] transition-colors border-t border-white/[0.03] cursor-pointer"
              >
                {expanded ? (
                  <>
                    <ChevronDown className="size-3" />
                    Collapse output
                  </>
                ) : (
                  <>
                    <ChevronRight className="size-3" />
                    Show full output ({lines} lines)
                  </>
                )}
              </button>
            )}
          </>
        )}

        {/* Exit code badge */}
        {exitCode !== undefined && exitCode !== null && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 border-t border-white/[0.03] bg-white/[0.01]">
            <span
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded",
                isSuccess
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400",
              )}
            >
              exit {exitCode}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default BashCommandCard;
