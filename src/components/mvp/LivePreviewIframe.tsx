"use client";

import { useState, useCallback } from "react";
import { RefreshCw, ExternalLink, Maximize2, Minimize2 } from "lucide-react";

interface LivePreviewIframeProps {
  previewUrl: string;
  slug: string;
  fallbackUrl?: string;
}

export default function LivePreviewIframe({
  previewUrl,
  slug,
  fallbackUrl,
}: LivePreviewIframeProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const src = loadError && fallbackUrl ? fallbackUrl : previewUrl;

  const handleRefresh = useCallback(() => {
    setIframeKey((k) => k + 1);
    setLoadError(false);
  }, []);

  const handleIframeError = useCallback(() => {
    if (!loadError && fallbackUrl) {
      setLoadError(true);
    }
  }, [loadError, fallbackUrl]);

  const handleOpenNewTab = useCallback(() => {
    window.open(src, "_blank", "noopener,noreferrer");
  }, [src]);

  const containerClass = expanded
    ? "fixed inset-0 z-50 bg-[#0b0d13]/95 backdrop-blur-xl p-4"
    : "relative";

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          {slug}
          {loadError && fallbackUrl && (
            <span className="ml-2 text-amber-400">• Falling back to VPS direct</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300 transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300 transition-colors"
            title={expanded ? "Exit fullscreen" : "Expand"}
          >
            {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
          <button
            onClick={handleOpenNewTab}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Iframe */}
      <div
        className={`overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.01] ${
          expanded ? "h-[calc(100vh-80px)]" : "h-[500px]"
        }`}
      >
        <iframe
          key={iframeKey}
          src={src}
          className="h-full w-full"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title={`Preview: ${slug}`}
          onError={handleIframeError}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Resize handle (only when not expanded) */}
      {!expanded && (
        <div className="mt-2 flex justify-center">
          <div className="h-1 w-12 rounded-full bg-white/[0.04]" />
        </div>
      )}
    </div>
  );
}
