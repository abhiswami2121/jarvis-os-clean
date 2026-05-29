"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * ChatStatusLine — a single, truthful live status pill shown above the composer
 * while Jarvis is working. Driven entirely by `jarvis:status` CustomEvents emitted
 * from the runtime event loop (jarvis-runtime.tsx). Zero coupling to the
 * assistant-ui message-content contract, so it cannot break message rendering.
 *
 * Event detail shape: { label: string | null }  — null/"" clears the pill.
 */
export type JarvisStatusDetail = { label: string | null };

export function emitJarvisStatus(label: string | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("jarvis:status", { detail: { label } }));
}

export default function ChatStatusLine() {
  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onStatus = (e: Event) => {
      const detail = (e as CustomEvent<JarvisStatusDetail>).detail;
      setLabel(detail?.label && detail.label.trim() ? detail.label : null);
    };
    window.addEventListener("jarvis:status", onStatus);
    return () => window.removeEventListener("jarvis:status", onStatus);
  }, []);

  return (
    <AnimatePresence>
      {label && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="mx-auto flex w-full max-w-(--thread-max-width) px-1"
          aria-live="polite"
        >
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
              "bg-white/[0.04] border border-white/10 backdrop-blur-md",
              "text-[12px] font-medium text-zinc-300 shadow-sm"
            )}
          >
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="truncate max-w-[60ch]">{label}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
