"use client";

import React from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { useArtifactStore, type ArtifactType } from "@/stores/artifactStore";
import { FileText, Code, Database, ExternalLink, BarChart3, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

// ── Types ──────────────────────────────────────────────────────────

interface CreateArtifactArgs {
  type: ArtifactType;
  title: string;
  content?: string;
  files?: { path: string; content: string; language?: string }[];
  columns?: { key: string; label: string; sortable?: boolean }[];
  rows?: Record<string, unknown>[];
  src?: string;
  slug?: string;
}

interface CreateArtifactResult {
  ok: boolean;
  artifact_id?: string;
}

// ── Icon map ───────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  report: FileText,
  code: Code,
  data: Database,
  "mini-app": ExternalLink,
  chart: BarChart3,
};

const TYPE_LABELS: Record<string, string> = {
  report: "Report",
  code: "Code",
  data: "Data Table",
  "mini-app": "Mini App",
  chart: "Chart",
};

const TYPE_COLORS: Record<string, Record<string, string>> = {
  report: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  code: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  data: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
  "mini-app": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  chart: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
};

// ── Tool UI ────────────────────────────────────────────────────────

export const CreateArtifactToolUI = makeAssistantToolUI<CreateArtifactArgs, CreateArtifactResult>({
  toolName: "create_artifact",
  render: ({ args, result }) => {
    const push = useArtifactStore((s) => s.push);
    const isReady = !!result?.ok;

    const type = args?.type || "report";
    const title = args?.title || "Untitled Artifact";
    const Icon = TYPE_ICONS[type] || FileText;
    const colors = TYPE_COLORS[type] || TYPE_COLORS.report;
    const label = TYPE_LABELS[type] || "Artifact";
    const contentPreview = args?.content
      ? args.content.slice(0, 200).replace(/\n/g, " ")
      : null;

    const handleOpen = () => {
      push({
        type,
        title,
        content: args?.content,
        files: args?.files,
        columns: args?.columns,
        rows: args?.rows,
        src: args?.src,
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="my-3 group"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border transition-all duration-300",
            "bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent",
            "backdrop-blur-2xl",
            "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_30px_rgba(0,0,0,0.12)]",
            "hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.18)]",
            isReady ? colors.border + " hover:" + colors.border.replace("20", "40") : "border-white/15 hover:border-white/25",
          )}
        >
          {/* Ambient glow */}
          <div
            className={cn(
              "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl",
              type === "code"
                ? "bg-gradient-to-br from-emerald-400/15 to-cyan-500/10"
                : type === "data"
                  ? "bg-gradient-to-br from-sky-400/15 to-blue-500/10"
                  : "bg-gradient-to-br from-purple-400/15 to-fuchsia-500/10",
            )}
          />

          {/* Header */}
          <div className="relative flex items-start justify-between gap-4 px-5 pt-5 pb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("inline-flex items-center justify-center size-6 rounded-lg", colors.bg, colors.text)}>
                  <Icon className="size-3.5" />
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  {label}
                </span>
                {isReady && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Created
                  </span>
                )}
                {!isReady && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Creating…
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-zinc-100 line-clamp-1">{title}</h3>
              {contentPreview && (
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2 italic">
                  {contentPreview}
                </p>
              )}
              {args?.slug && (
                <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                  /sandbox/{args.slug}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={handleOpen}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-zinc-700/90 to-zinc-800/90 hover:from-zinc-600 hover:to-zinc-700 text-white text-xs font-semibold shadow-lg shadow-zinc-900/25 transition-all active:scale-95 backdrop-blur-sm border border-white/10"
              >
                <span>Open</span>
                <ArrowUpRight className="size-3" />
              </button>
            </div>
          </div>

          {/* File count badge */}
          {args?.files && args.files.length > 0 && (
            <div className="relative border-t border-white/[0.06] px-5 py-2.5">
              <span className="text-[11px] text-zinc-500">
                {args.files.length} file{args.files.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  },
});

export default CreateArtifactToolUI;
