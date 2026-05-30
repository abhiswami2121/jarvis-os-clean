"use client";

import React, { useState, useEffect } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { useArtifactStore } from "@/lib/stores/artifact-store";
import { HistoryMarkdown } from "@/components/jarvis/HistoryMarkdown";
import { ChevronDown, FileText, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

type SlackCanvasArgs = {
  channel?: string;
  markdown?: string;
  permalink?: string;
  canvas_id?: string;
  title?: string;
};

type SlackCanvasResult = {
  ok?: boolean;
  ts?: string;
};

export const SlackCanvasToolUI = makeAssistantToolUI<SlackCanvasArgs, SlackCanvasResult>({
  toolName: "create_slack_canvas",
  render: ({ args, result }) => {
    const open = useArtifactStore((s) => s.open);
    const title = args?.title || "Mission Synthesis";
    const channel = args?.channel || "jarvis-admin";
    const isReady = !!result?.ok;
    const markdown = args?.markdown || "";

    // Auto-expand preview when canvas is first published
    const [previewOpen, setPreviewOpen] = useState(false);
    const prevReady = React.useRef(false);
    useEffect(() => {
      if (isReady && !prevReady.current && markdown) {
        setPreviewOpen(true);
      }
      prevReady.current = isReady;
    }, [isReady, markdown]);

    // Truncated preview for collapsed state (first ~300 chars)
    const previewSnippet = markdown
      ? markdown.replace(/^#.*$/gm, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 300)
      : "";

    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="my-3 group"
      >
        <div className={cn(
          "relative overflow-hidden rounded-2xl border transition-all duration-300",
          "bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent",
          "backdrop-blur-2xl",
          "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_30px_rgba(0,0,0,0.12)]",
          "hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.18)]",
          isReady
            ? "border-purple-500/25 hover:border-purple-500/40"
            : "border-white/15 hover:border-white/25",
        )}>
          {/* Ambient glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-fuchsia-400/20 to-purple-500/10 blur-2xl" />
          {isReady && (
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-400/10 to-cyan-500/5 blur-xl" />
          )}

          {/* ── Header Bar ── */}
          <div className="relative flex items-start justify-between gap-4 px-5 pt-5 pb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center size-6 rounded-lg bg-purple-500/10 text-purple-400">
                  <FileText className="size-3.5" />
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Mission Canvas
                </span>
                {isReady && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Published
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-zinc-100 line-clamp-1">{title}</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Posted to <span className="text-zinc-300">#{channel}</span>
                {args?.canvas_id && (
                  <span className="text-zinc-600 ml-2 font-mono">
                    {args.canvas_id.slice(0, 8)}…
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => open({
                  title,
                  channel,
                  permalink: args?.permalink,
                  canvas_id: args?.canvas_id,
                  markdown: args?.markdown,
                  ts: result?.ts,
                })}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500/90 to-purple-600/90 hover:from-fuchsia-500 hover:to-purple-600 text-white text-xs font-semibold shadow-lg shadow-purple-500/25 transition-all active:scale-95 backdrop-blur-sm border border-white/10"
              >
                <span>Open Canvas</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </button>
              {args?.permalink && (
                <a
                  href={args.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 text-center transition-colors"
                >
                  Slack ↗
                </a>
              )}
            </div>
          </div>

          {/* ── Inline Markdown Preview ── */}
          {markdown && (
            <div className="relative border-t border-white/[0.06]">
              {/* Collapse/expand toggle */}
              <button
                onClick={() => setPreviewOpen(!previewOpen)}
                className="w-full flex items-center gap-2 px-5 py-2.5 text-left hover:bg-white/[0.02] transition-colors group/btn"
              >
                <Sparkles className="size-3 text-amber-400/60" />
                <span className="text-[11px] font-medium text-zinc-400 group-hover/btn:text-zinc-300 transition-colors">
                  {previewOpen ? "Hide Summary" : "Show Summary"}
                </span>
                <span className="flex-1" />
                <ChevronDown
                  className={cn(
                    "size-3.5 text-zinc-500 transition-transform duration-200",
                    previewOpen && "rotate-180",
                  )}
                />
              </button>

              {/* Preview content */}
              <AnimatePresence initial={false}>
                {previewOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5">
                      <div className={cn(
                        "rounded-xl border border-white/[0.06] bg-black/20 backdrop-blur-sm",
                        "max-h-[420px] overflow-y-auto",
                        "prose prose-invert prose-sm max-w-none",
                        "prose-headings:text-zinc-200 prose-headings:font-semibold",
                        "prose-p:text-zinc-300 prose-p:leading-relaxed",
                        "prose-strong:text-zinc-100",
                        "prose-code:text-amber-300 prose-code:bg-amber-500/10 prose-code:px-1 prose-code:rounded",
                        "prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline",
                        "prose-li:text-zinc-300",
                        "prose-hr:border-white/10",
                        "[&_pre]:bg-zinc-900/80 [&_pre]:border [&_pre]:border-white/[0.06] [&_pre]:rounded-lg",
                        "[&_table]:w-full [&_th]:text-left [&_th]:text-zinc-400 [&_td]:text-zinc-300",
                        "[&_th]:border-b [&_th]:border-white/10 [&_td]:border-b [&_td]:border-white/5",
                        "[&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-1.5",
                      )}>
                        <div className="px-4 py-3.5">
                          <HistoryMarkdown content={markdown} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsed snippet */}
              {!previewOpen && previewSnippet && (
                <div className="px-5 pb-3">
                  <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 italic">
                    {previewSnippet}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No markdown state */}
          {!markdown && isReady && (
            <div className="relative border-t border-white/[0.06] px-5 py-3">
              <p className="text-[11px] text-zinc-500 italic">
                Full report available in Slack. Click &ldquo;Open Canvas&rdquo; above to view.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  },
});
