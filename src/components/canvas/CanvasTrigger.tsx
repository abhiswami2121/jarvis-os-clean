"use client";

import React from "react";
import { Maximize2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useCanvasStore, type TemplateType, type CanvasData } from "@/lib/stores/canvas-store";

// ── Props ───────────────────────────────────────────────────────

interface CanvasTriggerProps {
  template: TemplateType;
  data: CanvasData;
  label?: string;
  className?: string;
  variant?: "button" | "icon" | "inline";
}

// ── Component ───────────────────────────────────────────────────

/**
 * "Open in Canvas" button. Placed on artifact blocks or embedded
 * in message actions to open structured data in the canvas overlay.
 */
export function CanvasTrigger({
  template,
  data,
  label = "Open in Canvas",
  className,
  variant = "button",
}: CanvasTriggerProps) {
  const open = useCanvasStore((s) => s.open);

  const handleClick = () => {
    open({ template, data, title: data.title });
  };

  if (variant === "icon") {
    return (
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center size-8 rounded-lg",
          "bg-white/[0.04] border border-white/[0.06]",
          "text-zinc-400 hover:text-emerald-400",
          "hover:bg-emerald-500/[0.06] hover:border-emerald-500/20",
          "transition-all duration-200",
          className,
        )}
        aria-label={label}
      >
        <Maximize2 className="size-4" />
      </motion.button>
    );
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs",
          "text-zinc-500 hover:text-emerald-400",
          "transition-colors duration-150",
          className,
        )}
      >
        <Maximize2 className="size-3" />
        <span>{label}</span>
      </button>
    );
  }

  // Default: button variant
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "bg-gradient-to-r from-emerald-500/[0.08] to-violet-500/[0.06]",
        "border border-white/[0.06]",
        "text-xs font-medium text-zinc-300",
        "hover:text-emerald-300 hover:border-emerald-500/20",
        "hover:shadow-[0_0_20px_-8px_rgba(16,185,129,0.15)]",
        "transition-all duration-200",
        className,
      )}
    >
      <Maximize2 className="size-3.5" />
      <span>{label}</span>
    </motion.button>
  );
}
