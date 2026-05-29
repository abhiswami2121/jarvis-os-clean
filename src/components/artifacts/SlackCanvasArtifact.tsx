"use client";

import React, { useState } from "react";
import { FileText, ExternalLink, ChevronDown } from "lucide-react";
import type { SlackCanvasArtifact as SlackCanvasArtifactType } from "@/lib/artifacts/types";

export const SlackCanvasArtifact: React.FC<{ artifact: SlackCanvasArtifactType }> = ({ artifact }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="my-4 p-px rounded-2xl bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border border-purple-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
      {/* Compact header bar */}
      <div className={`flex items-center justify-between gap-3 px-4 py-3 bg-zinc-950/90 ${isOpen ? "rounded-t-[15px]" : "rounded-[15px]"} backdrop-blur-md min-h-[64px]`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-zinc-200 truncate">{artifact.title || "Slack Canvas"}</h4>
            <p className="text-[10px] text-zinc-500 font-mono truncate">
              {artifact.channel ? `#${artifact.channel}` : "slack-canvas"}
              {artifact.canvas_id ? ` · ${artifact.canvas_id.slice(0, 12)}…` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {artifact.permalink && (
            <a
              href={artifact.permalink}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition-all inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3 h-3" />
              Slack
            </a>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-medium transition-all shadow-[0_0_15px_rgba(147,51,234,0.25)] inline-flex items-center gap-1.5"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            {isOpen ? "Collapse" : "Open"}
          </button>
        </div>
      </div>

      {/* Expandable markdown preview */}
      {isOpen && (
        <div className="px-4 py-4 bg-zinc-900/90 rounded-b-[15px] border-t border-white/5 max-h-[500px] overflow-y-auto animate-slide-down min-h-[200px]">
          {artifact.markdown_preview ? (
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
              {artifact.markdown_preview}
            </pre>
          ) : (
            <div className="text-zinc-500 text-xs italic">No preview available. Open in Slack via button above.</div>
          )}
        </div>
      )}
    </div>
  );
};
