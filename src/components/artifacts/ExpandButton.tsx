"use client";

import React from "react";
import { Maximize2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";
import type { Artifact } from "@/lib/artifacts/types";

// ── Props ─────────────────────────────────────────────────────────

interface ExpandButtonProps {
  artifact: Artifact;
  className?: string;
}

// ── Label per type ────────────────────────────────────────────────

const EXPAND_LABELS: Record<string, string> = {
  data_table: "Open in Spreadsheet",
  chart: "Open in Chart View",
  status_card: "Open in Dashboard",
  action_panel: "Open Actions",
  slack_canvas: "Open Report",
  error_recovery: "Open Details",
};

// ── Component ─────────────────────────────────────────────────────

/**
 * Floating "Expand" button that appears on hover over inline artifacts.
 * Opens the artifact in the full ArtifactWorkspace drawer.
 */
export function ExpandButton({ artifact, className }: ExpandButtonProps) {
  const openArtifact = useWorkspaceStore((s) => s.openArtifact);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openArtifact(artifact);
  };

  const label = EXPAND_LABELS[artifact.type] || "Open in Workspace";

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.9 }}
      whileHover={{ opacity: 1, scale: 1.05 }}
      onClick={handleClick}
      className={cn(
        "absolute top-2 right-2 z-10",
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
        "bg-zinc-900/90 backdrop-blur-md border border-white/[0.08]",
        "text-[10px] font-medium text-zinc-400",
        "hover:text-emerald-300 hover:border-emerald-500/30 hover:bg-emerald-500/[0.06]",
        "hover:shadow-[0_0_16px_-4px_rgba(16,185,129,0.15)]",
        "opacity-0 group-hover/artifact:opacity-100",
        "transition-all duration-200",
        className,
      )}
      aria-label={label}
      title={label}
    >
      <Maximize2 className="size-3" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}

export default ExpandButton;
