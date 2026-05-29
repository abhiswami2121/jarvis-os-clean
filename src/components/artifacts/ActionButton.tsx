"use client";

import { useState, useCallback } from "react";
import { Loader2, AlertTriangle, RotateCcw, Send, RefreshCw, FileText, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { ActionButton as ActionButtonType } from "@/lib/artifacts/types";

// ── Intent → Icon mapping ──────────────────────────────────────
const INTENT_ICONS: Record<string, React.ElementType> = {
  bulk_recovery: RotateCcw,
  start_recovery: RotateCcw,
  pay_now: Send,
  send_link: Send,
  cancel_sub: AlertTriangle,
  approve_refund: Zap,
  export_csv: FileText,
  retry: RefreshCw,
};

function intentIcon(intent: string): React.ElementType {
  for (const [key, icon] of Object.entries(INTENT_ICONS)) {
    if (intent.includes(key) || key.includes(intent)) return icon;
  }
  return Zap;
}

// ── Variant styles ──────────────────────────────────────────────
const variantStyles = {
  primary: "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50",
  secondary: "bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-300 border-zinc-500/25 hover:border-zinc-500/40",
  danger: "bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/25 hover:border-red-500/50",
} as const;

const variantLoaderStyles = {
  primary: "text-emerald-400",
  secondary: "text-zinc-400",
  danger: "text-red-400",
} as const;

// ── Props ───────────────────────────────────────────────────────
interface ActionButtonProps {
  action: ActionButtonType;
  /** Callback when user confirms/executes the action */
  onExecute?: (intent: string, payload?: unknown) => void;
  className?: string;
}

export function ActionButton({ action, onExecute, className }: ActionButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const Icon = intentIcon(action.intent);

  const handleClick = useCallback(() => {
    if (action.requiresConfirm && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);
    setShowConfirm(false);

    // Dispatch action intent
    if (onExecute) {
      onExecute(action.intent, action.payload);
    } else {
      // Default: post message to chat
      const msg = `Execute action: ${action.intent}${action.payload ? ` with payload ${JSON.stringify(action.payload)}` : ""}`;
      // Use a custom event so the parent chat component can pick it up
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("jarvis:artifact-action", {
            detail: { intent: action.intent, payload: action.payload, label: action.label },
          })
        );
      }
    }

    // Simulate brief loading then reset
    setTimeout(() => setLoading(false), 600);
  }, [action, showConfirm, onExecute]);

  const handleCancel = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const variant = action.variant || "primary";

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <AnimatePresence mode="wait">
        {showConfirm ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="inline-flex items-center gap-1"
          >
            <span className="text-[11px] text-zinc-400 mr-1">
              {action.confirmMessage || "Confirm?"}
            </span>
            <button
              onClick={handleClick}
              disabled={loading}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium border transition-colors",
                variant === "danger"
                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/40"
                  : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40"
              )}
            >
              {loading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                "Yes"
              )}
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center rounded-md px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              No
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="action"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            onClick={handleClick}
            disabled={loading}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all duration-150",
              variantStyles[variant],
              loading && "opacity-70 cursor-wait"
            )}
          >
            {loading ? (
              <Loader2 className={cn("size-3 animate-spin", variantLoaderStyles[variant])} />
            ) : (
              <Icon className="size-3" />
            )}
            <span>{action.label}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ActionButton;
