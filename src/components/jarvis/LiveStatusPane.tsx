"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuiState } from "@assistant-ui/react";
import { cn } from "@/lib/utils";
import {
  Activity,
  Clock,
  Gauge,
  Hash,
  AlertTriangle,
  Wrench,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

export interface LiveStatusPaneProps {
  className?: string;
  sessionId?: string;
  toolBudget?: number;
}

interface Finding {
  severity: string;
  issue: string;
  category: string;
}

// ── Component ──────────────────────────────────────────────────────

export function LiveStatusPane({ className, toolBudget = 350 }: LiveStatusPaneProps) {
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const messages = useAuiState((s) => s.thread.messages);
  const [collapsed, setCollapsed] = React.useState(false);

  // Session ID from localStorage
  const [sessionId, setSessionId] = React.useState<string>("---");
  React.useEffect(() => {
    const sid = typeof window !== "undefined"
      ? localStorage.getItem("jarvis-os:session:v1") || sessionStorage.getItem("jarvis-os:cid:v1")
      : null;
    if (sid) setSessionId(sid.slice(0, 20) + "...");
  }, [isRunning]);

  // Tool count from current conversation
  const toolCount = React.useMemo(() => {
    if (!messages) return 0;
    let count = 0;
    for (const msg of messages) {
      const parts = (msg as any).content || (msg as any).parts || [];
      if (Array.isArray(parts)) {
        count += parts.filter((p: any) => p?.type === "tool-call").length;
      }
    }
    return count;
  }, [messages]);

  // Extract last 3 findings from messages
  const lastFindings = React.useMemo((): Finding[] => {
    if (!messages) return [];
    const findings: Finding[] = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      const parts = (messages[i] as any).content || (messages[i] as any).parts || [];
      if (!Array.isArray(parts)) continue;
      for (const p of parts) {
        if (p?.type === "tool-call" && /finding_emitted|emit_finding/i.test(p?.toolName || "")) {
          findings.push({
            severity: p?.args?.severity || "info",
            issue: p?.args?.issue || "",
            category: p?.args?.category || "general",
          });
          if (findings.length >= 3) break;
        }
      }
      if (findings.length >= 3) break;
    }
    return findings;
  }, [messages]);

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

  const mm = Math.floor(elapsed / 60);
  const ss = elapsed % 60;
  const elapsedStr = `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;

  // ETA
  const budgetRemaining = Math.max(0, toolBudget - toolCount);
  const eta = toolCount > 0 && elapsed > 0
    ? Math.max(0, Math.round((toolBudget / toolCount) * elapsed - elapsed))
    : null;
  const etaMin = eta !== null ? Math.floor(eta / 60) : 0;
  const etaSec = eta !== null ? eta % 60 : 0;

  // Severity color for findings
  const sevColor = (s: string) => {
    switch (s) {
      case "critical": return "text-red-400";
      case "high": return "text-orange-400";
      case "medium": return "text-amber-400";
      case "low": return "text-sky-400";
      default: return "text-zinc-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "fixed right-0 top-0 bottom-0 z-20",
        collapsed ? "w-10" : "w-[320px]",
        "transition-all duration-300",
        className,
      )}
    >
      <div
        className={cn(
          "h-full flex flex-col",
          "bg-[#08080f]/95 backdrop-blur-2xl",
          "border-l border-white/[0.06]",
          "shadow-[-8px_0_32px_-12px_rgba(0,0,0,0.4)]",
          collapsed ? "px-0" : "px-4 py-5",
          "overflow-hidden",
          "transition-all duration-300",
        )}
      >
        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer",
            collapsed ? "justify-center py-4" : "mb-5",
          )}
          aria-label={collapsed ? "Expand status pane" : "Collapse status pane"}
        >
          <Activity className={cn("size-3.5", isRunning ? "text-emerald-400" : "text-zinc-600")} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left font-medium">Live Status</span>
              <ChevronUp className="size-3" />
            </>
          )}
          {collapsed && <ChevronDown className="size-3" />}
        </button>

        {!collapsed && (
          <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
            {/* Session ID */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">
                <Hash className="size-3" />
                Session
              </div>
              <code className="block text-[11px] font-mono text-zinc-400 truncate bg-white/[0.03] rounded-md px-2 py-1.5 border border-white/[0.04]">
                {sessionId}
              </code>
            </div>

            {/* Tool Budget */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">
                <Wrench className="size-3" />
                Tools Used
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono tabular-nums text-zinc-200 font-medium">
                  {toolCount}
                </span>
                <span className="text-xs text-zinc-500">/ {toolBudget}</span>
                <span className="ml-auto text-[10px] font-mono text-emerald-400/70">
                  {budgetRemaining} remaining
                </span>
              </div>
              {/* Budget progress bar */}
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500/60 to-blue-500/60 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (toolCount / toolBudget) * 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Elapsed */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">
                <Clock className="size-3" />
                Elapsed
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono tabular-nums text-zinc-200">
                  {elapsedStr}
                </span>
                {isRunning && (
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                  </span>
                )}
              </div>
            </div>

            {/* ETA */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">
                <Gauge className="size-3" />
                ETA
              </div>
              <span className="text-lg font-mono tabular-nums text-zinc-400">
                {eta !== null ? `${etaMin}:${etaSec.toString().padStart(2, "0")}` : "---"}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.04]" />

            {/* Last 3 findings */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">
                <AlertTriangle className="size-3 text-amber-500/70" />
                Last Findings
              </div>
              <AnimatePresence>
                {lastFindings.length === 0 && (
                  <p className="text-[10px] text-zinc-600 italic">No findings yet</p>
                )}
                {lastFindings.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                    className={cn(
                      "rounded-lg px-2.5 py-2",
                      "bg-white/[0.03] border border-white/[0.05]",
                      "border-l-2 border-l-[#eab308]",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[9px] font-mono uppercase tracking-wider", sevColor(f.severity))}>
                        {f.severity}
                      </span>
                      <span className="text-[9px] text-zinc-600">in {f.category}</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug line-clamp-2">
                      {f.issue}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default LiveStatusPane;
