"use client";
import React from "react";
import type { ArtifactPayload } from "@/lib/stores/artifact-store";

export const SlackManifest: React.FC<{ payload: ArtifactPayload | null }> = ({ payload }) => {
  const channel = payload?.channel || "jarvis-admin";
  const ts = payload?.ts || String(Date.now() / 1000);
  const canvasId = payload?.canvas_id || "—";
  const permalink = payload?.permalink;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent backdrop-blur-xl p-4">
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-3">Slack Manifest</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Target Channel</span>
            <span className="font-mono text-sm text-zinc-100">#{channel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Canvas ID</span>
            <span className="font-mono text-[11px] text-zinc-300">{canvasId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Block Timestamp</span>
            <span className="font-mono text-[11px] text-zinc-300">{ts}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Payload Verification</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Verified
            </span>
          </div>
        </div>
      </div>
      {permalink && (
        <a href={permalink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/5 backdrop-blur-xl p-4 hover:border-fuchsia-400/40 transition-all">
          <div>
            <p className="text-xs text-zinc-400">View on Slack</p>
            <p className="font-mono text-[11px] text-fuchsia-300 truncate max-w-[400px]">{permalink}</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-fuchsia-400"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
        </a>
      )}
      {payload?.markdown && (
        <details className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <summary className="cursor-pointer p-4 text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-300">Raw Markdown Preview ▾</summary>
          <pre className="p-4 pt-0 text-[11px] text-zinc-400 whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">{payload.markdown.slice(0, 4000)}</pre>
        </details>
      )}
    </div>
  );
};
