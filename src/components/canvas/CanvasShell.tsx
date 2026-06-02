"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { X, PanelRightClose, PanelRightOpen, Share, Rocket, Download, Copy, Check } from "lucide-react";
import { CommandPalette, type PaletteAction } from "./CommandPalette";
import { toast } from "sonner";
import JSZip from "jszip";

interface CanvasShellProps {
  slug: string;
  title?: string;
  status?: "planning" | "generating" | "previewing" | "deploying" | "verifying" | "complete" | "error";
  leftRail?: ReactNode;
  rightRail?: ReactNode;
  children: ReactNode;
  onDeploy?: () => void;
  deployedUrl?: string;
  /** Reasoning text for the right rail reasoning pane */
  reasoningText?: string;
  /** Extra palette actions */
  paletteActions?: PaletteAction[];
  /** Files for download zip */
  downloadFiles?: { path: string; content: string }[];
}

const STATUS_STYLES: Record<string, string> = {
  planning: "bg-amber-400/10 text-amber-400 ring-amber-400/20",
  generating: "bg-amber-400/10 text-amber-400 ring-amber-400/20",
  previewing: "bg-amber-400/10 text-amber-400 ring-amber-400/20",
  deploying: "bg-amber-400/10 text-amber-400 ring-amber-400/20",
  verifying: "bg-emerald-400/10 text-emerald-400 ring-emerald-400/20",
  complete: "bg-emerald-400/10 text-emerald-400 ring-emerald-400/20",
  error: "bg-red-400/10 text-red-400 ring-red-400/20",
};

export function CanvasShell({
  slug,
  title,
  status,
  leftRail,
  rightRail,
  children,
  onDeploy,
  deployedUrl,
  reasoningText,
  paletteActions,
  downloadFiles,
}: CanvasShellProps) {
  const [showRight, setShowRight] = useState(false);
  const [showLeft, setShowLeft] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Download zip handler
  const handleDownload = useCallback(async () => {
    if (!downloadFiles || downloadFiles.length === 0) {
      toast.error("No files to download");
      return;
    }
    try {
      const zip = new JSZip();
      for (const file of downloadFiles) {
        zip.file(file.path, file.content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-artifact.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${downloadFiles.length} file${downloadFiles.length !== 1 ? "s" : ""}`);
    } catch (err) {
      toast.error("Download failed");
    }
  }, [downloadFiles, slug]);

  // Share handler — copy URL to clipboard
  const handleShare = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => {
          setShareCopied(true);
          toast.success("Link copied to clipboard!");
          setTimeout(() => setShareCopied(false), 2000);
        },
        () => toast.error("Failed to copy link"),
      );
    }
  }, []);

  // Cmd+K / Ctrl+K global keybinding
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        actions={paletteActions}
      />
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.04] bg-zinc-950/90 px-4 backdrop-blur-xl">
        {/* Left rail toggle */}
        {leftRail && (
          <button
            onClick={() => setShowLeft(!showLeft)}
            className="flex size-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 transition-colors"
            aria-label={showLeft ? "Hide sidebar" : "Show sidebar"}
          >
            <PanelRightClose className="size-4 rotate-180" />
          </button>
        )}

        {/* Title */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h1 className="truncate text-sm font-semibold tracking-tight text-zinc-100">
            {title || slug}
          </h1>
          {status && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${STATUS_STYLES[status] || STATUS_STYLES.planning}`}
            >
              <span className="size-1 rounded-full bg-current animate-pulse" />
              {status}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {downloadFiles && downloadFiles.length > 0 && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-white/[0.06] hover:bg-white/[0.08] transition-colors"
              aria-label="Download as zip"
            >
              <Download className="size-3" />
              Zip
            </button>
          )}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-white/[0.06] hover:bg-white/[0.08] transition-colors"
            aria-label="Share link"
          >
            {shareCopied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            {shareCopied ? "Copied!" : "Share"}
          </button>
          {onDeploy && (
            <button
              onClick={onDeploy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20 hover:bg-emerald-400/20 transition-colors"
            >
              <Rocket className="size-3" />
              Deploy
            </button>
          )}
          {deployedUrl && (
            <a
              href={deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-white/[0.06] hover:bg-white/[0.08] transition-colors"
            >
              <Share className="size-3" />
              Open
            </a>
          )}
          {rightRail && (
            <button
              onClick={() => setShowRight(!showRight)}
              className="flex size-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 transition-colors"
              aria-label={showRight ? "Hide details" : "Show details"}
            >
              {showRight ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
            </button>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Rail */}
        {leftRail && showLeft && (
          <aside className="w-64 shrink-0 overflow-y-auto border-r border-white/[0.04] bg-zinc-950/50 p-3">
            {leftRail}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Right Rail (collapsible) */}
        {rightRail && showRight && (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-white/[0.04] bg-zinc-950/50 p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Details
              </span>
              <button
                onClick={() => setShowRight(false)}
                className="flex size-6 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
            {/* Reasoning pane */}
            {reasoningText && (
              <div className="mb-3 rounded-lg border border-amber-500/[0.08] bg-amber-500/[0.03] p-3">
                <div className="text-[10px] font-medium text-amber-400/70 uppercase tracking-wider mb-2">
                  Reasoning
                </div>
                <pre className="text-[11px] font-mono text-amber-200/70 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {reasoningText || "No reasoning data yet…"}
                </pre>
              </div>
            )}
            {rightRail}
          </aside>
        )}
      </div>
    </div>
    </>
  );
}

export default CanvasShell;
