"use client";

import React from "react";
import { Globe, ExternalLink, Code, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeployedAppArtifact } from "@/lib/artifacts/types";

// ── Props ─────────────────────────────────────────────────────────

interface DeployedAppCardProps {
  artifact: DeployedAppArtifact;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Inline card rendered in the chat when a deployed_app artifact is detected.
 * Shows app name, live URL, status, and an "Open in Workspace" hint.
 */
export function DeployedAppCard({ artifact, className }: DeployedAppCardProps) {
  const isLive = artifact.status === "live";
  const hasUrl = !!artifact.live_url;
  const statusLabel = {
    generating: "Generating…",
    sandbox: "Sandbox ready",
    building: "Building…",
    deploying: "Deploying…",
    live: "Live",
    error: "Error",
  }[artifact.status] ?? artifact.status;

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-emerald-950/20",
        "border border-white/[0.08] backdrop-blur-xl",
        "shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)]",
        "hover:border-emerald-500/20 transition-all duration-300",
        className,
      )}
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-emerald-500/40 via-cyan-500/20 to-transparent" />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-2.5 mb-3">
          {/* App type icon */}
          <div className={cn(
            "size-8 rounded-lg flex items-center justify-center shrink-0",
            isLive
              ? "bg-emerald-500/10 border border-emerald-500/20"
              : "bg-amber-500/10 border border-amber-500/20",
          )}>
            {isLive ? (
              <Globe className="size-4 text-emerald-400" />
            ) : artifact.status === "sandbox" ? (
              <Code className="size-4 text-blue-400" />
            ) : (
              <Rocket className="size-4 text-amber-400" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-zinc-100 truncate">
              {artifact.title ?? "MVP App"}
            </h3>
            <p className="text-[11px] text-zinc-500 truncate">
              {artifact.description || (artifact.app_type?.replace(/_/g, " ") ?? "Web App")}
            </p>
          </div>

          {/* Status badge */}
          <span className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-medium border shrink-0",
            isLive
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : artifact.status === "error"
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20",
          )}>
            {statusLabel}
          </span>
        </div>

        {/* URL row */}
        {hasUrl && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/[0.06] min-w-0">
              <Globe className="size-3 text-zinc-500 shrink-0" />
              <span className="text-[11px] text-zinc-400 truncate">
                {artifact.live_url?.replace(/^https?:\/\//, "")}
              </span>
            </div>
            <a
              href={artifact.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-zinc-400 hover:text-zinc-200 bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-all shrink-0"
            >
              <ExternalLink className="size-3" />
              <span className="hidden sm:inline">Open</span>
            </a>
          </div>
        )}

        {/* Bottom hint */}
        <p className="text-[10px] text-zinc-600">
          Click <span className="text-zinc-500 font-medium">Expand</span> to open full workspace preview ↗
        </p>
      </div>
    </div>
  );
}

export default DeployedAppCard;
