"use client";

import { useState, useCallback } from "react";
import { Loader, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";

// ─── Props ──────────────────────────────────────────────────────────

interface MiniAppRendererProps {
  src: string;
  title?: string;
}

// ─── Component ──────────────────────────────────────────────────────

/**
 * Sandboxed iframe renderer for live MVP previews.
 * Shows a loading skeleton until iframe.onload fires.
 * Security: allow-scripts, allow-same-origin, allow-forms only.
 */
export default function MiniAppRenderer({
  src,
  title = "Preview",
}: MiniAppRendererProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(false);
    setIframeKey((k) => k + 1);
  }, []);

  const handleOpen = useCallback(() => {
    window.open(src, "_blank", "noopener,noreferrer");
  }, [src]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.04] px-4 py-2">
        <span className="text-xs font-medium text-zinc-500 truncate flex-1">
          {title}
        </span>
        <button
          onClick={handleRefresh}
          className="flex size-7 items-center justify-center rounded-md text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300 transition-colors"
          title="Refresh preview"
        >
          <RefreshCw className="size-3.5" />
        </button>
        <button
          onClick={handleOpen}
          className="flex size-7 items-center justify-center rounded-md text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="size-3.5" />
        </button>
      </div>

      {/* Preview area */}
      <div className="relative flex-1 bg-white/[0.01]">
        {/* Loading skeleton */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950">
            <Loader className="size-6 animate-spin text-emerald-400" />
            <p className="text-xs text-zinc-500 font-mono">
              Loading {title}…
            </p>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full bg-white/[0.04] animate-pulse"
                  style={{
                    width: `${40 + i * 20}px`,
                    animationDelay: `${i * 200}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 p-8">
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-400/5 ring-1 ring-red-400/10">
              <AlertTriangle className="size-5 text-red-400/60" />
            </div>
            <p className="text-sm text-zinc-400">Failed to load preview</p>
            <p className="text-xs text-zinc-600 text-center max-w-xs">
              The preview server may have stopped or the URL is unreachable.
            </p>
            <button
              onClick={handleRefresh}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.08] transition-colors"
            >
              <RefreshCw className="size-3" />
              Retry
            </button>
          </div>
        )}

        {/* Iframe */}
        <iframe
          key={iframeKey}
          src={src}
          title={title}
          sandbox="allow-scripts allow-same-origin allow-forms"
          className="h-full w-full border-0"
          onLoad={handleLoad}
          onError={handleError}
          referrerPolicy="no-referrer"
          style={{ display: loading ? "hidden" : "block" }}
        />
      </div>
    </div>
  );
}
