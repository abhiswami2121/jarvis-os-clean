"use client";

import React from "react";
import { useAuiState } from "@assistant-ui/react";
import { useReducedMotion } from "motion/react";

/**
 * ChatAurora v4 — PURE CSS implementation (Tailwind-purge immune).
 * All gradients + animations defined in globals.css as concrete CSS classes.
 */
export const ChatAurora: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const reducedMotion = useReducedMotion();
  const animate = isRunning && !reducedMotion;

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isRunning ? "Agent is thinking and processing your request." : ""}
      </div>
      <div className="chat-aurora-container relative w-full h-full overflow-hidden">
        <div
          aria-hidden="true"
          className={`chat-aurora-stage ${animate ? "is-active" : "is-idle"}`}
        >
          <div className={`aurora-blob aurora-blob-1 ${animate ? "is-animating" : ""}`} />
          <div className={`aurora-blob aurora-blob-2 ${animate ? "is-animating" : ""}`} />
          <div className={`aurora-blob aurora-blob-3 ${animate ? "is-animating" : ""}`} />
        </div>
        <div className="aurora-idle-glow" aria-hidden="true" />
        <div className="relative z-10 w-full h-full">{children}</div>
      </div>
    </>
  );
};
