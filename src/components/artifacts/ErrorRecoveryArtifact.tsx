"use client";

import React from "react";
import { motion } from "motion/react";
import { AlertTriangle, RefreshCw, GitBranch, X, ArrowRight, MessageSquare } from "lucide-react";
import type { ErrorRecoveryArtifact } from "@/lib/artifacts/types";

const ICON_MAP: Record<string, React.ElementType> = {
  clear_history: X,
  new_branch: GitBranch,
  retry: RefreshCw,
  abort: X,
  escalate: AlertTriangle,
  contact_support: MessageSquare,
};

const VARIANT_STYLES: Record<string, string> = {
  primary: "bg-gradient-to-r from-indigo-500/80 to-purple-500/80 hover:from-indigo-500 hover:to-purple-500 text-white border-indigo-400/30",
  secondary: "bg-white/5 hover:bg-white/10 text-zinc-100 border-white/20",
  danger: "bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-400/30",
};

const ERROR_TYPE_COLORS: Record<string, string> = {
  context_overflow: "text-amber-300 border-amber-400/30",
  circuit_breaker: "text-red-300 border-red-400/30",
  tool_failure: "text-orange-300 border-orange-400/30",
  timeout: "text-yellow-300 border-yellow-400/30",
  network: "text-sky-300 border-sky-400/30",
  generic: "text-zinc-300 border-zinc-400/30",
};

export const ErrorRecoveryArtifactComponent: React.FC<{ artifact: ErrorRecoveryArtifact; onAction?: (intent: string, actionId: string) => void }> = ({ artifact, onAction }) => {
  const accent = ERROR_TYPE_COLORS[artifact.errorType] || ERROR_TYPE_COLORS.generic;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative w-full min-h-[180px] rounded-2xl border ${accent} bg-zinc-950/40 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] p-5 my-3`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 size-10 rounded-xl bg-white/5 flex items-center justify-center ${accent.split(' ')[0]}`}>
          <AlertTriangle className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-zinc-100 mb-1">{artifact.title}</h3>
          <p className="text-sm text-zinc-300 leading-relaxed">{artifact.message}</p>
          {artifact.detail && (
            <p className="mt-2 text-xs text-zinc-500 font-mono whitespace-pre-wrap">{artifact.detail}</p>
          )}
          {artifact.failingTool && (
            <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-400/20 text-xs text-red-200">
              <span className="font-mono">{artifact.failingTool}</span>
              {artifact.failureCount && <span className="text-red-300/70">× {artifact.failureCount}</span>}
            </div>
          )}
        </div>
      </div>
      {artifact.actions && artifact.actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {artifact.actions.map((action) => {
            const Icon = ICON_MAP[action.intent] || ArrowRight;
            const variantClass = VARIANT_STYLES[action.variant || "secondary"];
            return (
              <button
                key={action.id}
                onClick={() => onAction?.(action.intent, action.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${variantClass}`}
              >
                <Icon className="size-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
