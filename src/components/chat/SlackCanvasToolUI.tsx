"use client";

import React from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { useArtifactStore } from "@/lib/stores/artifact-store";

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

    return (
      <div className="my-3 group">
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent backdrop-blur-2xl p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:border-white/25 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.18)]">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-fuchsia-400/20 to-purple-500/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📊</span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Mission Canvas</span>
                {isReady && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Published
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-zinc-100 line-clamp-1">{title}</h3>
              <p className="text-xs text-zinc-400 mt-1">Posted to <span className="text-zinc-300">#{channel}</span></p>
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
        </div>
      </div>
    );
  },
});
