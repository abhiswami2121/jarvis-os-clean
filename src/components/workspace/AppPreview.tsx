"use client";

import React, { useState, useMemo } from "react";
import { Globe, ExternalLink, RefreshCw, Code, Rocket, Copy, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { DeployedAppArtifact } from "@/lib/artifacts/types";

// ── Props ─────────────────────────────────────────────────────────

interface AppPreviewProps {
  artifact: DeployedAppArtifact;
  className?: string;
}

// ── Status Config ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  generating: { label: "Generating", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: <Loader2 className="size-3 animate-spin" /> },
  sandbox: { label: "Sandbox", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: <Code className="size-3" /> },
  building: { label: "Building", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: <Loader2 className="size-3 animate-spin" /> },
  deploying: { label: "Deploying", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", icon: <Rocket className="size-3" /> },
  live: { label: "Live", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: <Globe className="size-3" /> },
  error: { label: "Error", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: <RefreshCw className="size-3" /> },
};

const FRAMEWORK_LABELS: Record<string, string> = {
  html: "HTML",
  react: "React",
  nextjs: "Next.js",
  vite: "Vite",
};

// ── Component ─────────────────────────────────────────────────────

/**
 * AppPreview — renders a deployed MVP/demo app in an iframe with controls.
 *
 * Modes:
 * - live: Shows the Vercel deployment URL in an iframe
 * - sandbox: Shows srcdoc HTML for instant preview
 * - code: Shows source files (future: syntax highlighted)
 */
export function AppPreview({ artifact, className }: AppPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState<"live" | "sandbox" | "code">(
    artifact.live_url ? "live" : artifact.html_content ? "sandbox" : "code"
  );

  const status = STATUS_CONFIG[artifact.status] ?? STATUS_CONFIG.generating;

  // Sandbox srcdoc
  const srcdoc = useMemo(() => {
    if (!artifact.html_content) return undefined;
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
<body>${artifact.html_content}</body>
</html>`;
  }, [artifact.html_content]);

  const handleCopyUrl = async () => {
    if (!artifact.live_url) return;
    try {
      await navigator.clipboard.writeText(artifact.live_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleRefresh = () => {
    setIframeKey((k) => k + 1);
  };

  const liveUrl = artifact.live_url;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.01] shrink-0">
        {/* Status Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border",
          status.bg, status.color
        )}>
          {status.icon}
          <span>{status.label}</span>
        </div>

        {/* Framework Badge */}
        {artifact.framework && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/[0.04] text-zinc-500 border border-white/[0.04]">
            {FRAMEWORK_LABELS[artifact.framework] ?? artifact.framework}
          </span>
        )}

        {/* App Type */}
        <span className="text-[10px] text-zinc-600 hidden sm:inline capitalize">
          {artifact.app_type?.replace(/_/g, " ") ?? "app"}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View Mode Switcher */}
        <div className="flex items-center gap-0.5">
          {([
            { mode: "live" as const, label: "Live", icon: <Globe className="size-3" />, disabled: !liveUrl },
            { mode: "sandbox" as const, label: "Sandbox", icon: <Code className="size-3" />, disabled: !artifact.html_content },
            { mode: "code" as const, label: "Source", icon: <Code className="size-3" />, disabled: !artifact.source_files?.length },
          ]).map(({ mode, label, icon, disabled }) => (
            <button
              key={mode}
              type="button"
              disabled={disabled}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                viewMode === mode
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  : disabled
                    ? "text-zinc-700 cursor-not-allowed"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-transparent",
              )}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* URL bar (Live mode) */}
        {viewMode === "live" && liveUrl && (
          <div className="flex items-center gap-1 ml-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] text-zinc-400 truncate max-w-[160px] sm:max-w-[240px]">
                {liveUrl.replace(/^https?:\/\//, "")}
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              </button>
            </div>
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-all"
              title="Open in new tab"
            >
              <ExternalLink className="size-3" />
            </a>
          </div>
        )}

        {/* Refresh button */}
        {viewMode === "live" && (
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-all"
            title="Refresh preview"
          >
            <RefreshCw className="size-3" />
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 relative bg-[#08080f]">
        <AnimatePresence mode="wait">
          {viewMode === "live" && liveUrl && (
            <motion.div
              key="live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <iframe
                key={iframeKey}
                src={liveUrl}
                title={artifact.title ?? "MVP App"}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                className="w-full h-full border-0"
              />
            </motion.div>
          )}

          {viewMode === "live" && !liveUrl && (
            <EmptyState
              icon={<Rocket className="size-10 text-zinc-700" />}
              title="Not yet deployed"
              description="This app hasn't been deployed to Vercel yet. Deploy it to see the live preview."
            />
          )}

          {viewMode === "sandbox" && srcdoc && (
            <motion.div
              key="sandbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <iframe
                srcDoc={srcdoc}
                title={`${artifact.title ?? "App"} (Sandbox)`}
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-full border-0"
              />
            </motion.div>
          )}

          {viewMode === "sandbox" && !srcdoc && (
            <EmptyState
              icon={<Code className="size-10 text-zinc-700" />}
              title="No sandbox content"
              description="Generate HTML content to preview in sandbox mode."
            />
          )}

          {viewMode === "code" && (
            <motion.div
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full overflow-auto"
            >
              <SourceView sourceFiles={artifact.source_files ?? []} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Action Bar ── */}
      {artifact.actions && artifact.actions.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-white/[0.06] bg-white/[0.01] shrink-0">
          {artifact.actions.map((action, i) => (
            <button
              key={i}
              type="button"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all border",
                action.variant === "primary" && "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20",
                action.variant === "danger" && "bg-red-500/10 text-red-300 border-red-500/20 hover:bg-red-500/20",
                (!action.variant || action.variant === "secondary") && "bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:bg-white/[0.08]",
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Source View ────────────────────────────────────────────────────

function SourceView({ sourceFiles }: { sourceFiles: Array<{ path: string; content: string; language: string }> }) {
  if (!sourceFiles.length) {
    return (
      <EmptyState
        icon={<Code className="size-10 text-zinc-700" />}
        title="No source files"
        description="Source files will appear here when the app is generated."
      />
    );
  }

  const [activeFile, setActiveFile] = useState(0);

  return (
    <div className="flex flex-col h-full">
      {/* File tabs */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-white/[0.04] bg-white/[0.01] overflow-x-auto">
        {sourceFiles.map((file, i) => (
          <button
            key={file.path}
            type="button"
            onClick={() => setActiveFile(i)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-all",
              i === activeFile
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-transparent",
            )}
          >
            <span className="text-[9px] opacity-60">{file.language}</span>
            <span>{file.path}</span>
          </button>
        ))}
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-xs font-mono text-zinc-300 leading-relaxed">
          <code>{sourceFiles[activeFile]?.content ?? ""}</code>
        </pre>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="size-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
          {icon}
        </div>
        <p className="text-sm text-zinc-400">{title}</p>
        <p className="text-xs text-zinc-600 max-w-[280px]">{description}</p>
      </div>
    </div>
  );
}

export default AppPreview;
