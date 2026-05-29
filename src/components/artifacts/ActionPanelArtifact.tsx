"use client";

import { motion } from "motion/react";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionButton } from "@/components/artifacts/ActionButton";
import type { ActionPanelArtifact as ActionPanelArtifactType } from "@/lib/artifacts/types";

// ── Severity Config ─────────────────────────────────────────────
const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    ring: "ring-sky-500/15",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    ring: "ring-amber-500/15",
  },
  critical: {
    icon: ShieldAlert,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    ring: "ring-red-500/15",
  },
} as const;

// ── Main Component ──────────────────────────────────────────────
interface ActionPanelArtifactProps {
  artifact: ActionPanelArtifactType;
  className?: string;
}

export function ActionPanelArtifact({ artifact, className }: ActionPanelArtifactProps) {
  const { title, description, actions, severity } = artifact;
  const config = SEVERITY_CONFIG[severity || "info"];
  const SevIcon = config.icon;

  const handleActionExecute = (intent: string, payload?: unknown) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("jarvis:artifact-action", {
          detail: { intent, payload, source: "action_panel", panelTitle: title },
        })
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "my-3 overflow-hidden rounded-xl border bg-white/[0.02] backdrop-blur-sm ring-1",
        config.border,
        config.ring,
        className
      )}
    >
      {/* ── Header ── */}
      <div className="min-h-[120px] flex items-start gap-3 border-b border-white/[0.04] px-4 py-3">
        <div className={cn("flex size-7 items-center justify-center rounded-lg border mt-0.5 flex-shrink-0", config.bg, config.border)}>
          <SevIcon className={cn("size-3.5", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        {actions.map((action, i) => (
          <ActionButton
            key={`${action.intent}-${i}`}
            action={action}
            onExecute={handleActionExecute}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default ActionPanelArtifact;
