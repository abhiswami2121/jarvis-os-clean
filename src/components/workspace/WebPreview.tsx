"use client";

import React, { useState, useMemo } from "react";
import { Globe, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Artifact } from "@/lib/artifacts/types";

// ── Props ─────────────────────────────────────────────────────────

interface WebPreviewProps {
  artifact: Artifact;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Renders a sandboxed iframe preview. For HTML artifacts (like generated
 * landing pages), renders the content directly. For URL references,
 * loads the URL. Includes a URL bar for navigation.
 */
export function WebPreview({ artifact, className }: WebPreviewProps) {
  const [url, setUrl] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract HTML content from the artifact if available
  const htmlContent = useMemo(() => {
    if ("markdown_preview" in artifact && artifact.markdown_preview) {
      return artifact.markdown_preview;
    }
    // Check if artifact has raw HTML in a metadata field
    if ("metadata" in artifact && (artifact as any).metadata?.html) {
      return (artifact as any).metadata.html;
    }
    return null;
  }, [artifact]);

  // If there's raw HTML, use srcdoc
  const srcdoc = useMemo(() => {
    if (!htmlContent) return undefined;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #08080f;
      color: #fafafa;
      padding: 24px;
      line-height: 1.6;
    }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`;
  }, [htmlContent]);

  const handleNavigate = () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setError(null);
    let normalized = url.trim();
    if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
      normalized = "https://" + normalized;
    }
    setIframeUrl(normalized);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNavigate();
  };

  const iframeSrc = srcdoc ? undefined : iframeUrl;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* URL bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.04] bg-white/[0.01]">
        <Globe className="size-3.5 text-zinc-500 shrink-0" />
        <input
          type="text"
          placeholder="Enter URL or use provided HTML content…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 outline-none"
        />
        <button
          onClick={handleNavigate}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
        >
          <ExternalLink className="size-3" />
          <span className="hidden sm:inline">Go</span>
        </button>
        {isLoading && (
          <RefreshCw className="size-3.5 text-zinc-400 animate-spin" />
        )}
      </div>

      {/* Iframe */}
      <div className="flex-1 relative bg-[#08080f]">
        {(srcdoc || iframeUrl) ? (
          <iframe
            title="Web Preview"
            srcDoc={srcdoc}
            src={iframeSrc}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError("Failed to load content");
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <Globe className="size-10 text-zinc-700" />
              <p className="text-sm text-zinc-500">No content to preview</p>
              <p className="text-xs text-zinc-600 max-w-[280px]">
                Enter a URL above, or open an artifact with HTML content
              </p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="size-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ExternalLink className="size-4 text-red-400" />
              </div>
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setIframeUrl("");
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WebPreview;
