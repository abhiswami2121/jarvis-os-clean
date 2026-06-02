"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check, Loader, AlertTriangle, Clock } from "lucide-react";

export interface PhaseData {
  id: string;
  label: string;
  status: "idle" | "active" | "complete" | "error";
  durationMs?: number;
  summary?: string;
}

interface PhaseTimelineProps {
  phases: PhaseData[];
}

const PHASE_ICONS: Record<PhaseData["status"], React.ComponentType<{ className?: string }>> = {
  idle: Clock,
  active: Loader,
  complete: Check,
  error: AlertTriangle,
};

const ICON_COLORS: Record<PhaseData["status"], string> = {
  idle: "text-zinc-600",
  active: "text-sky-400 animate-spin",
  complete: "text-emerald-400",
  error: "text-red-400",
};

const DOT_COLORS: Record<PhaseData["status"], string> = {
  idle: "bg-zinc-700 ring-zinc-700/20",
  active: "bg-sky-400 ring-sky-400/30 animate-pulse",
  complete: "bg-emerald-400 ring-emerald-400/30",
  error: "bg-red-400 ring-red-400/30",
};

export default function PhaseTimeline({ phases }: PhaseTimelineProps) {
  const [expanded, setExpanded] = useState<string | null>(
    phases.find((p) => p.status === "active")?.id || null
  );

  if (!phases.length) return null;

  return (
    <div className="relative px-4 py-3">
      {/* Vertical line */}
      <div className="absolute left-[1.15rem] top-3 bottom-3 w-px bg-white/[0.04]" />

      <div className="flex flex-col gap-2">
        {phases.map((phase, i) => {
          const Icon = PHASE_ICONS[phase.status];
          const isExpanded = expanded === phase.id;
          const isLast = i === phases.length - 1;

          return (
            <div key={phase.id} className="relative">
              {/* Dot */}
              <div className="absolute left-0 top-1.5">
                <div
                  className={`size-2.5 rounded-full ring-2 ring-offset-2 ring-offset-zinc-950 ${DOT_COLORS[phase.status]}`}
                />
              </div>

              {/* Content */}
              <div className="ml-6">
                <button
                  onClick={() => setExpanded(isExpanded ? null : phase.id)}
                  className="flex w-full items-center gap-2 text-left group"
                >
                  <span
                    className={`flex-1 text-xs font-medium transition-colors ${
                      phase.status === "active"
                        ? "text-zinc-100"
                        : phase.status === "complete"
                          ? "text-zinc-300"
                          : phase.status === "error"
                            ? "text-red-300"
                            : "text-zinc-500"
                    }`}
                  >
                    {phase.label}
                  </span>
                  {phase.durationMs != null && (
                    <span className="text-[10px] text-zinc-600 tabular-nums">
                      {(phase.durationMs / 1000).toFixed(1)}s
                    </span>
                  )}
                  <ChevronDown
                    className={`size-3 text-zinc-500 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && phase.summary && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500 pl-0.5">
                        {phase.summary}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
