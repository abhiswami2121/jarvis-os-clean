"use client";
import { useEffect, useState } from "react";
import type { ConnectionState } from "@/components/jarvis/ConnectionPill";

/**
 * Tracks live connection state by listening to SSE events on the runtime adapter.
 * Phase B: pulls health from a /api/system/pulse heartbeat every 30s.
 * Phase C: will subscribe to actual SSE event timestamps from the runtime.
 */
export function useConnectionState() {
  const [state, setState] = useState<ConnectionState>("connected");
  const [latency, setLatency] = useState<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let consecutiveFails = 0;

    const ping = async () => {
      const start = Date.now();
      try {
        const res = await fetch("/api/system/pulse", { cache: "no-store", signal: AbortSignal.timeout(5000) });
        if (cancelled) return;
        const dur = Date.now() - start;
        if (res.ok) {
          consecutiveFails = 0;
          setLatency(dur);
          setState("connected");
        } else {
          consecutiveFails++;
          if (consecutiveFails >= 3) setState("offline");
          else setState("reconnecting");
        }
      } catch (e) {
        if (cancelled) return;
        consecutiveFails++;
        if (consecutiveFails >= 3) setState("offline");
        else setState("reconnecting");
      }
    };

    ping();
    const id = setInterval(ping, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { state, latency, setState };
}
