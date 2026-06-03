"use client";
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ChevronDown, ChevronUp, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * HistoryShell — minimal pagination + resume indicator.
 *
 * Replaces ConversationHydrator's message rendering. Messages are now
 * seeded into the Thread as initialMessages (see page.tsx). This component
 * only handles:
 *  1. "Load earlier messages" button (when hasMoreOlder)
 *  2. "Resuming stream…" indicator (when VPS stream hasn't completed)
 *  3. Collapse/expand toggle for the pagination strip
 *
 * Architecture: ONE render path. All messages — history AND live —
 * use the Thread's single component tree. No more double UI.
 */
interface HistoryShellProps {
  cid: string | null;
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  loadOlder: () => Promise<void>;
  isResuming: boolean;
  hasHistory: boolean;
  expanded: boolean;
}

export function HistoryShell({
  cid,
  hasMoreOlder,
  loadingOlder,
  loadOlder,
  isResuming,
  hasHistory,
  expanded: defaultExpanded,
}: HistoryShellProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  // Keep expanded in sync when hasMoreOlder changes
  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  // Resume toast
  useEffect(() => {
    if (isResuming) toast.loading("Resuming conversation…", { id: "resume-toast", duration: 60000 });
    else toast.dismiss("resume-toast");
  }, [isResuming]);

  if (!cid) return null;
  if (!hasHistory) return null;
  if (!hasMoreOlder && !isResuming) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-2">
      <AnimatePresence mode="wait">
        {!expanded ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            onClick={() => setExpanded(true)}
            className="mx-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 hover:border-white/20 transition-all"
          >
            <History className="size-3.5" />
            <span>{hasMoreOlder ? "Earlier messages available" : "Stream pending"}</span>
            <ChevronDown className="size-3.5" />
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ChevronUp className="size-3" />
                Collapse
              </button>
            </div>

            {/* Load earlier button */}
            {hasMoreOlder && (
              <div className="flex justify-center">
                <button
                  onClick={loadOlder}
                  disabled={loadingOlder}
                  className="text-xs text-zinc-400 hover:text-zinc-100 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {loadingOlder ? (
                    <><Loader2 className="size-3 animate-spin" /> Loading…</>
                  ) : (
                    "Load earlier messages"
                  )}
                </button>
              </div>
            )}

            {/* Resuming indicator */}
            {isResuming && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-emerald-400">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Resuming stream…</span>
              </div>
            )}

            {/* Divider: history above, live below */}
            <div className="flex items-center justify-center gap-2 pt-2 text-[10px] uppercase tracking-widest text-zinc-600">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-500/30" />
              <span className="text-emerald-400/70">History</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-500/30" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
