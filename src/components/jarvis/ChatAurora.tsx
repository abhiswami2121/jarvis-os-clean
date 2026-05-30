"use client";

import React from "react";
import { useAuiState } from "@assistant-ui/react";
import { useReducedMotion } from "motion/react";

/**
 * ChatAurora v5 — Gemini-style northern-lights.
 * Renders a FIXED full-viewport aurora layer BEHIND the chat content so it is
 * never clipped by the scroll container. Always faintly alive (idle), and
 * blooms brighter + animates while the agent is running.
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
      {/* Fixed aurora layer — sits behind everything, never clipped/scrolled */}
      <div
        aria-hidden="true"
        className={`chat-aurora-fixed ${animate ? "is-active" : "is-idle"}`}
      >
        <div className={`aurora-blob aurora-blob-1 ${animate ? "is-animating" : ""}`} />
        <div className={`aurora-blob aurora-blob-2 ${animate ? "is-animating" : ""}`} />
        <div className={`aurora-blob aurora-blob-3 ${animate ? "is-animating" : ""}`} />
        <div className="aurora-idle-glow" />
      </div>
      <div className="relative z-10 w-full h-full">{children}</div>
    </>
  );
};
