"use client";

import React from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { useArtifactStore } from "@/stores/artifactStore";
import { ExternalLink, ArrowUpRight, Loader2, Box } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

interface StartMvpBuildArgs {
  prompt: string;
  type?: string;
}

interface StartMvpBuildResult {
  slug: string;
  title: string;
  status: string;
  sessionId?: string;
}

// ── Tool UI ────────────────────────────────────────────────────────

export const StartMvpBuildToolUI = makeAssistantToolUI<StartMvpBuildArgs, StartMvpBuildResult>({
  toolName: "start_mvp_build",
  render: ({ args, result }) => {
    const push = useArtifactStore((s) => s.push);
    const isDone = !!result?.slug;
    const title = result?.title || args?.prompt?.slice(0, 60) || "MVP";
    const isError = result?.status === "planning_failed" || result?.status === "pipeline_error";

    const handleOpen = () => {
      if (!result?.slug) return;
      push({
        type: "mini-app",
        title,
        src: `/sandbox/${result.slug}`,
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="my-3"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border transition-all duration-300",
            "bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent",
            "backdrop-blur-2xl",
            "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_30px_rgba(0,0,0,0.12)]",
            isDone
              ? "border-amber-500/20 hover:border-amber-500/40"
              : isError
                ? "border-red-500/20"
                : "border-amber-500/10 hover:border-amber-500/25",
          )}
        >
          {/* Ambient glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl bg-gradient-to-br from-amber-400/15 to-orange-500/10" />

          {/* Header */}
          <div className="relative flex items-start justify-between gap-4 px-5 pt-5 pb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "inline-flex items-center justify-center size-6 rounded-lg",
                  isDone ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400",
                )}>
                  {isDone ? (
                    <ExternalLink className="size-3.5" />
                  ) : isError ? (
                    <Box className="size-3.5" />
                  ) : (
                    <Loader2 className="size-3.5 animate-spin" />
                  )}
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  MVP Builder
                </span>
                {isDone && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Built
                  </span>
                )}
                {isError && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Error
                  </span>
                )}
                {!isDone && !isError && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Building
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-zinc-100 line-clamp-1">{title}</h3>
              {result?.slug && (
                <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                  /sandbox/{result.slug}
                </p>
              )}
            </div>

            {isDone && (
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={handleOpen}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600/90 to-orange-700/90 hover:from-amber-500 hover:to-orange-600 text-white text-xs font-semibold shadow-lg shadow-amber-900/25 transition-all active:scale-95 backdrop-blur-sm border border-amber-400/20"
                >
                  <span>View canvas</span>
                  <ArrowUpRight className="size-3" />
                </button>
              </div>
            )}
          </div>

          {/* Status detail */}
          <div className="relative border-t border-white/[0.06] px-5 py-2.5">
            {!isDone && !isError && (
              <div className="flex items-center gap-2">
                <span className="flex size-2">
                  <span className="absolute inline-flex size-2 animate-ping rounded-full bg-amber-400/60" />
                  <span className="relative inline-flex size-2 rounded-full bg-amber-400/80" />
                </span>
                <span className="text-[11px] text-amber-400/80">
                  Planning & generating files via DeepSeek V4 Pro…
                </span>
              </div>
            )}
            {isDone && (
              <span className="text-[11px] text-zinc-500">
                Status: {result.status} · Click &quot;View canvas&quot; to open
              </span>
            )}
            {isError && (
              <span className="text-[11px] text-red-400/80">
                Build failed — check the prompt and try again
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  },
});

export default StartMvpBuildToolUI;
