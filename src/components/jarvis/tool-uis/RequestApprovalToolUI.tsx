"use client";

import React from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { ShieldCheck, ShieldX, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

// ── Types ──────────────────────────────────────────────────────────

interface RequestApprovalArgs {
  action: string;
  details?: string;
  risk?: "low" | "medium" | "high";
}

interface RequestApprovalResult {
  approved: boolean;
  by: string;
}

// ── Tool UI ────────────────────────────────────────────────────────

export const RequestApprovalToolUI = makeAssistantToolUI<
  RequestApprovalArgs,
  RequestApprovalResult
>({
  toolName: "request_approval",
  render: ({ args, addResult, result }) => {
    // Already resolved — show result chip
    if (result) {
      const approved = result.approved;
      return (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="my-2"
        >
          <div
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border ${
              approved
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {approved ? (
              <ShieldCheck className="size-3.5" />
            ) : (
              <ShieldX className="size-3.5" />
            )}
            <span>{approved ? "✓ Approved" : "✗ Rejected"}</span>
            <span className="text-zinc-500">by {result.by}</span>
          </div>
        </motion.div>
      );
    }

    // Pending — show approval card
    const riskColor =
      args.risk === "high"
        ? "border-red-500/50 bg-red-500/10"
        : args.risk === "medium"
          ? "border-amber-500/50 bg-amber-500/10"
          : "border-amber-500/30 bg-amber-500/5";

    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="my-3"
      >
        <div
          className={`relative overflow-hidden rounded-xl border ${riskColor} backdrop-blur-sm shadow-[0_4px_24px_-12px_rgba(245,158,11,0.08)]`}
        >
          {/* Ambient glow */}
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl bg-gradient-to-br from-amber-400/10 to-orange-500/5" />

          <div className="relative px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <AlertTriangle className="size-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-amber-300">
                  {args.action || "Approval required"}
                </div>
                {args.details && (
                  <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {args.details}
                  </div>
                )}
                {args.risk && (
                  <span
                    className={`inline-block mt-2 text-[10px] font-mono uppercase tracking-wider rounded px-1.5 py-0.5 ${
                      args.risk === "high"
                        ? "bg-red-500/15 text-red-400"
                        : args.risk === "medium"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-zinc-500/15 text-zinc-400"
                    }`}
                  >
                    {args.risk} risk
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => addResult({ approved: true, by: "user" })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/25 transition-all active:scale-95 border border-emerald-400/20"
              >
                <ShieldCheck className="size-3" />
                Approve
              </button>
              <button
                onClick={() => addResult({ approved: false, by: "user" })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700/90 hover:bg-zinc-600 text-zinc-200 text-xs font-semibold transition-all active:scale-95 border border-white/10"
              >
                <ShieldX className="size-3" />
                Reject
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  },
});

export default RequestApprovalToolUI;
