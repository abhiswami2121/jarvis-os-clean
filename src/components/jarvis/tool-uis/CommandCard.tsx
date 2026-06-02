"use client";

import React, { useState } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { Terminal, ChevronDown, ChevronRight, Check, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ── Types ──────────────────────────────────────────────────────────

interface CommandArgs {
  cmd?: string;
  cwd?: string;
  tool_id?: string;
  exit_code?: number;
  output_preview?: string;
  duration_ms?: number;
}

// ── Tool UI ────────────────────────────────────────────────────────

export const CommandCard = makeAssistantToolUI<CommandArgs, { ok?: boolean }>({
  toolName: "command_run",
  render: ({ args }) => {
    const [expanded, setExpanded] = useState(false);

    const cmd = args.cmd || "";
    const output = args.output_preview || "";
    const exitCode = args.exit_code;
    const isRunning = exitCode === undefined || exitCode === null;
    const isSuccess = exitCode === 0;
    const isError = exitCode !== undefined && exitCode !== 0;
    const shouldCollapse = !expanded && output.split("\n").length > 6;

    return (
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="my-2"
      >
        <div className="relative overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-sm shadow-[0_4px_24px_-12px_rgba(0,0,0,0.3)]">
          {/* Command header */}
          <div className="relative flex items-center gap-2 px-3.5 py-2.5 border-b border-white/[0.04]">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
              <Terminal className="size-3.5" />
            </span>

            {/* Status indicator */}
            <span className="shrink-0">
              {isRunning && (
                <Loader2 className="size-3.5 text-amber-400 animate-spin" />
              )}
              {isSuccess && (
                <Check className="size-3.5 text-emerald-400" />
              )}
              {isError && (
                <X className="size-3.5 text-red-400" />
              )}
            </span>

            {/* Command text */}
            <code className="flex-1 min-w-0 text-xs font-mono text-zinc-300 truncate">
              <span className="text-emerald-400/70 select-none mr-1">$</span>
              {cmd}
            </code>

            {/* Duration */}
            {args.duration_ms && (
              <span className="text-[10px] font-mono text-zinc-600">
                {(args.duration_ms / 1000).toFixed(1)}s
              </span>
            )}
          </div>

          {/* Output area */}
          {output && (
            <>
              <div
                className={`relative overflow-hidden transition-all ${
                  shouldCollapse ? "max-h-36" : ""
                }`}
              >
                <pre
                  className={`px-3.5 py-2.5 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all ${
                    isError ? "text-red-300/80" : "text-zinc-400/80"
                  }`}
                >
                  {output}
                </pre>

                {/* Fade out when collapsed */}
                {shouldCollapse && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-900/90 to-transparent pointer-events-none" />
                )}
              </div>

              {/* Expand/collapse toggle — shown only if output > 6 lines */}
              {output.split("\n").length > 6 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 w-full px-3.5 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] transition-colors border-t border-white/[0.03]"
                >
                  {expanded ? (
                    <>
                      <ChevronDown className="size-3" />
                      Collapse output
                    </>
                  ) : (
                    <>
                      <ChevronRight className="size-3" />
                      Show full output ({output.split("\n").length} lines)
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {/* Exit code badge at bottom if status known */}
          {exitCode !== undefined && exitCode !== null && (
            <div className="flex items-center gap-2 px-3.5 py-1 border-t border-white/[0.03] bg-white/[0.01]">
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isSuccess
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                exit {exitCode}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  },
});

export default CommandCard;
