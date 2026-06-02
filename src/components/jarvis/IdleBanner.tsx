"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

/**
 * IdleBanner — Cardinal Law 1: Degradation over death.
 *
 * When SSE events stop arriving for 90+ seconds, this amber banner
 * appears to reassure the user that the agent is still working.
 * Auto-hides when the next SSE event arrives.
 *
 * Props:
 * - lastEventAt: timestamp (ms) of the last SSE event
 * - enabled: if false, banner is suppressed (e.g. before first event)
 */

interface IdleBannerProps {
  lastEventAt: number | null;
  enabled?: boolean;
}

const IDLE_THRESHOLD_MS = 90_000;

export function IdleBanner({ lastEventAt, enabled = true }: IdleBannerProps) {
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }

    const check = () => {
      if (lastEventAt === null) {
        setVisible(false);
        return;
      }
      const elapsed = Date.now() - lastEventAt;
      if (elapsed >= IDLE_THRESHOLD_MS) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    // Check immediately and then every 5 seconds
    check();
    intervalRef.current = setInterval(check, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [lastEventAt, enabled]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto mb-2 flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs text-amber-300 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <Clock className="size-3 shrink-0 text-amber-400" />
      <span>Agent thinking deeply — hold on, results coming soon</span>
    </div>
  );
}

export default IdleBanner;
