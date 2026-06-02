"use client";

import { useRef, useEffect, useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────

export interface SSEEvent {
  event: string;
  data: string;
  id?: string;
}

export type SSEEventHandler = (event: string, data: unknown) => void;

export interface UseSSEOptions {
  /** Typed event handler: called with (eventName, parsedData) */
  onEvent?: SSEEventHandler;
  /** Called on connection error */
  onError?: (error: string) => void;
  /** Called when connection opens */
  onConnect?: () => void;
  /** Called when connection is lost (heartbeat timeout or error) */
  onDisconnect?: () => void;
  /** Reconnect delay in ms (default 3000) */
  reconnectDelay?: number;
  /** Max reconnect attempts (default 10, 0 = infinite) */
  maxReconnectAttempts?: number;
  /** Seconds without heartbeat before marking dead (default 15) */
  heartbeatTimeout?: number;
}

export interface UseSSEReturn {
  connected: boolean;
  error: string | null;
  /** Fully abort and prevent reconnection */
  cancel: () => void;
  /** Manually reconnect */
  reconnect: () => void;
}

// ─── Hook ──────────────────────────────────────────────────────────

/**
 * SSE client hook with:
 * - Heartbeat tracking: marks connection dead after `heartbeatTimeout` ms of silence
 * - Auto-reconnect with exponential backoff (respects Last-Event-ID)
 * - Typed event dispatching via onEvent(eventName, parsedJSON)
 * - cancel() that fully aborts with no reconnect
 * - Uses fetch + ReadableStream (supports POST SSE, custom headers)
 */
export function useSSE(
  url: string | null,
  options: UseSSEOptions = {},
): UseSSEReturn {
  const {
    onEvent,
    onError,
    onConnect,
    onDisconnect,
    reconnectDelay = 3000,
    maxReconnectAttempts = 10,
    heartbeatTimeout = 15000,
  } = options;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs that persist across reconnects
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const abortedRef = useRef(false);
  const attemptsRef = useRef(0);
  const lastEventIdRef = useRef<string | null>(null);
  const hbTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const optsRef = useRef(options);
  optsRef.current = options;

  // ── Heartbeat helpers ──────────────────────────────────────────

  const clearHeartbeat = useCallback(() => {
    if (hbTimerRef.current !== null) {
      clearTimeout(hbTimerRef.current);
      hbTimerRef.current = null;
    }
  }, []);

  const resetHeartbeat = useCallback(() => {
    clearHeartbeat();
    if (abortedRef.current) return;
    hbTimerRef.current = setTimeout(() => {
      // No heartbeat received — treat connection as dead
      if (mountedRef.current && !abortedRef.current) {
        setConnected(false);
        optsRef.current.onDisconnect?.();
        readerRef.current?.cancel().catch(() => {});
        readerRef.current = null;
        scheduleReconnect();
      }
    }, heartbeatTimeout);
  }, [heartbeatTimeout, clearHeartbeat]);

  // ── Reconnect ──────────────────────────────────────────────────

  const scheduleReconnect = useCallback(() => {
    if (abortedRef.current) return;
    attemptsRef.current += 1;
    if (maxReconnectAttempts > 0 && attemptsRef.current > maxReconnectAttempts) {
      const msg = "Max reconnect attempts reached";
      if (mountedRef.current) {
        setError(msg);
        optsRef.current.onError?.(msg);
      }
      return;
    }
    const delay = Math.min(
      reconnectDelay * Math.pow(1.5, attemptsRef.current - 1),
      30000,
    );
    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current && !abortedRef.current) {
        doConnect();
      }
    }, delay);
  }, [reconnectDelay, maxReconnectAttempts]);

  // ── Cancel ─────────────────────────────────────────────────────

  const cancel = useCallback(() => {
    abortedRef.current = true;
    clearHeartbeat();
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    readerRef.current?.cancel().catch(() => {});
    readerRef.current = null;
    if (mountedRef.current) {
      setConnected(false);
      setError(null);
    }
  }, [clearHeartbeat]);

  // ── Connect ────────────────────────────────────────────────────

  const doConnect = useCallback(() => {
    if (!url || abortedRef.current || !mountedRef.current) return;

    let cleanedUp = false;

    async function connect() {
      try {
        const headers: Record<string, string> = { Accept: "text/event-stream" };
        if (lastEventIdRef.current) {
          headers["Last-Event-ID"] = lastEventIdRef.current;
        }

        const res = await fetch(url!, { headers });

        if (!res.ok || !res.body) {
          if (!cleanedUp && !abortedRef.current) {
            const msg = `SSE connection failed: ${res.status}`;
            if (mountedRef.current) setError(msg);
            optsRef.current.onError?.(msg);
          }
          scheduleReconnect();
          return;
        }

        if (!cleanedUp && mountedRef.current) {
          setConnected(true);
          setError(null);
          attemptsRef.current = 0;
          optsRef.current.onConnect?.();
        }

        resetHeartbeat();

        const reader = res.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = "";

        while (!abortedRef.current) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            if (!part.trim() || part.startsWith(":")) continue;
            if (cleanedUp || abortedRef.current) return;

            const lines = part.split("\n");
            let evName = "message";
            let dataLine = "";
            let idLine: string | undefined;

            for (const line of lines) {
              if (line.startsWith("event:")) {
                evName = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataLine = line.slice(5).trim();
              } else if (line.startsWith("id:")) {
                idLine = line.slice(3).trim();
              }
            }

            if (!dataLine) continue;

            // Track Last-Event-ID for reconnection
            if (idLine) lastEventIdRef.current = idLine;

            // Heartbeat: just reset the timer, don't dispatch
            if (evName === "heartbeat") {
              resetHeartbeat();
              continue;
            }

            // Dispatch typed event
            try {
              const parsed = JSON.parse(dataLine);
              optsRef.current.onEvent?.(evName, parsed);
            } catch {
              optsRef.current.onEvent?.(evName, dataLine);
            }

            resetHeartbeat();
          }
        }

        // Stream ended naturally — reconnect if not aborted
        if (!abortedRef.current && !cleanedUp) {
          if (mountedRef.current) setConnected(false);
          optsRef.current.onDisconnect?.();
          scheduleReconnect();
        }
      } catch (err: unknown) {
        if (!cleanedUp && !abortedRef.current && mountedRef.current) {
          const msg =
            err instanceof Error ? err.message : "SSE connection error";
          setError(msg);
          optsRef.current.onError?.(msg);
          setConnected(false);
          optsRef.current.onDisconnect?.();
          scheduleReconnect();
        }
      }
    }

    connect();

    return () => {
      cleanedUp = true;
    };
  }, [url, resetHeartbeat, scheduleReconnect]);

  // Reconnect (manual)
  const reconnect = useCallback(() => {
    cancel();
    abortedRef.current = false;
    attemptsRef.current = 0;
    doConnect();
  }, [cancel, doConnect]);

  // ── Effect ─────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    abortedRef.current = false;
    attemptsRef.current = 0;
    doConnect();
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  return { connected, error, cancel, reconnect };
}
