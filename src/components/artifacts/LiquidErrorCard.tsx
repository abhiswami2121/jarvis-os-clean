"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface LiquidErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  detail?: string;
}

/**
 * LiquidErrorCard — inline error component for artifact failures, stream aborts,
 * context timeouts, and tool errors. Renders with min-height guarantee to prevent
 * Cumulative Layout Shift when error replaces a loading state.
 *
 * Used by:
 * - ArtifactRouter when parser.ts fails Zod validation
 * - ArtifactAwareText when stream is aborted mid-block
 * - Future: VPS tool errors when surfaced through SSE
 */
export const LiquidErrorCard: React.FC<LiquidErrorCardProps> = ({
  title = "Render Issue",
  message,
  onRetry,
  detail,
}) => {
  return (
    <div className="min-h-[120px] rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm p-4 my-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-red-300">{title}</h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{message}</p>
          {detail && (
            <pre className="text-[10px] text-zinc-500 font-mono mt-2 p-2 bg-black/30 rounded overflow-x-auto max-h-24">
              {detail}
            </pre>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-red-300 hover:text-red-200 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
