"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuiState } from "@assistant-ui/react";
import { cn } from "@/lib/utils";
import { Activity, Clock, Gauge, Wrench } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

export interface StreamingProgressBarProps {
  toolBudget?: number;
  className?: string;
}

// ── Component ──────────────────────────────────────────────────────

export function StreamingProgressBar({ toolBudget = 350, className }: StreamingProgressBarProps) {
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const messages = useAuiState((s) => s.thread.messages);

  // Count tool calls in current assistant response
  const currentTools = React.useMemo(() => {
    if (!messages || !isRunning) return 0;
    const lastMsg = messages[messages.length - 1] as any;
    if (!lastMsg || lastMsg.role !== "assistant") return 0;
    const content = lastMsg.content || lastMsg.parts || [];
    if (!Array.isArray(content)) return 0;
    return content.filter((p: any) => p?.type === "tool-call").length;
  }, [messages, isRunning]);

  // Elapsed timer
  const [startTime] = React.useState(() => Date.now());
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (!isRunning) return;
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  // Reset start time when a new run begins
  const prevRunning = React.useRef(isRunning);
  React.useEffect(() => {
    if (isRunning && !prevRunning.current) {
      // Just started — timer auto-resets via startTime state
    }
    prevRunning.current = isRunning;
  }, [isRunning]);

  // Format elapsed time
  const mm = Math.floor(elapsed / 60);
  const ss = elapsed % 60;
  const elapsedStr = `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;

  // ETA estimate based on tools used vs budget
  const eta = currentTools > 0 && elapsed > 0
    ? Math.max(0, Math.round((toolBudget / currentTools) * elapsed - elapsed))
    : null;
  const etaStr = eta !== null
    ? `${Math.floor(eta / 60)}:${(eta % 60).toString().padStart(2, "0")}`
    : "---";

  // Budget percentage
  const budgetPct = Math.min(100, Math.round((currentTools / toolBudget) * 100));

  return (
    <AnimatePresence>
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "jc-card jc-progress sticky top-0 z-20",
            "rounded-xl backdrop-blur-md bg-white/[0.04] border border-white/[0.08]",
            "shadow-[0_4px_20px_-8px_rgba(16,185,129,0.06)]",
            "mx-auto w-full max-w-(--thread-max-width) mb-3",
            className,
          )}
        >
          <div className="flex items-center gap-3 px-4 py-2.5">
            {/* Activity indicator */}
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
            </span>

            {/* Tool count */}
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-300">
              <Wrench className="size-3 text-blue-400" />
              <span>{currentTools}</span>
              <span className="text-zinc-600">/ {toolBudget} tools</span>
            </span>

            {/* Budget bar */}
            <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden min-w-0 max-w-[120px]">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500/60 to-blue-500/60 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${budgetPct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Spacer */}
            <span className="flex-1" />

            {/* Elapsed */}
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500">
              <Clock className="size-3 text-zinc-600" />
              {elapsedStr}
            </span>

            {/* ETA */}
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500">
              <Gauge className="size-3 text-zinc-600" />
              {etaStr}
            </span>

            {/* Streaming label */}
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/[0.06] text-[10px] text-emerald-400/80 font-medium">
              <Activity className="size-2.5" />
              Streaming
            </span>
          </div>

          {/* Pulse border animation when active */}
          <div className="absolute inset-0 rounded-xl pointer-events-none">
            <div className="absolute inset-0 rounded-xl border border-emerald-500/[0.08] animate-pulse" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StreamingProgressBar;
