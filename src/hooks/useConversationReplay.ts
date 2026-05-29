"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { replayConversation, replayConversationPage, type ReplayEvent } from "@/lib/jarvis-os-client";
import { useSessionStore } from "@/lib/session-store";

export type MessagePart =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | {
      type: "tool-call";
      toolCallId: string;
      toolName: string;
      args: Record<string, any>;
      result?: any;
      status: "running" | "complete" | "incomplete";
    };

export interface HydratedMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parts: MessagePart[];
  seq: number;
  timestamp: number;
}

const RECENT_PAGE_SIZE = 50;

/**
 * Replays a conversation from VPS SQLite with PAGINATION.
 *
 * NEW BEHAVIOR (fixes Versailles):
 *  - Initial load: only the LAST 50 events (instant scroll-to-bottom)
 *  - User clicks "Load earlier" to fetch older pages
 *  - Session-store cache: instant re-mount on navigation back
 *  - 60s polling for in-flight streams (unchanged)
 */
export function useConversationReplay(cid: string | null) {
  const cacheGet = useSessionStore((s) => s.getCachedMessages);
  const cacheSet = useSessionStore((s) => s.cacheMessages);
  const cacheSeq = useSessionStore((s) => s.getCachedLastSeq);

  const [messages, setMessages] = useState<HydratedMessage[]>([]);
  const [lastSeq, setLastSeq] = useState(0);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [oldestLoadedSeq, setOldestLoadedSeq] = useState<number>(Infinity);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(false);

  const stateRef = useRef({
    allEvents: [] as ReplayEvent[],
    lastSeq: 0,
    isComplete: false,
    startTime: 0,
    cancelled: false,
  });

  // P5: load older events on demand
  const loadOlder = useCallback(async () => {
    if (!cid || loadingOlder || !hasMoreOlder) return;
    setLoadingOlder(true);
    try {
      const before = oldestLoadedSeq === Infinity ? undefined : oldestLoadedSeq;
      const resp = await replayConversationPage(cid, {
        limit: RECENT_PAGE_SIZE,
        before,
        direction: "oldest",
      });
      if (resp && resp.events && resp.events.length > 0) {
        const s = stateRef.current;
        // Prepend older events, dedupe by seq
        const existingSeqs = new Set(s.allEvents.map((e) => e.seq));
        const newOnes = resp.events.filter((e) => !existingSeqs.has(e.seq));
        s.allEvents = [...newOnes, ...s.allEvents].sort((a, b) => a.seq - b.seq);
        const reduced = reduceEvents(s.allEvents);
        setMessages(reduced);
        const oldest = Math.min(...newOnes.map((e) => e.seq));
        setOldestLoadedSeq(oldest);
        setHasMoreOlder(!!resp.has_more);
      } else {
        setHasMoreOlder(false);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load older messages");
    } finally {
      setLoadingOlder(false);
    }
  }, [cid, loadingOlder, hasMoreOlder, oldestLoadedSeq]);

  useEffect(() => {
    if (!cid) {
      setMessages([]); setLastSeq(0); setLoading(false);
      setError(null); setIsResuming(false);
      setHasMoreOlder(false); setOldestLoadedSeq(Infinity);
      return;
    }

    // P5: check session cache FIRST — instant if hit
    const cached = cacheGet(cid);
    if (cached && cached.length > 0) {
      setMessages(cached);
      setLastSeq(cacheSeq(cid));
      setLoading(false);
      // Still background-refresh for any new events
    }

    const s = stateRef.current;
    s.allEvents = []; s.lastSeq = 0; s.isComplete = false;
    s.startTime = Date.now(); s.cancelled = false;

    let pollTimer: ReturnType<typeof setTimeout>;
    if (!cached) setLoading(true);
    setIsResuming(false);

    const processBatch = (events: ReplayEvent[]) => {
      if (s.cancelled || events.length === 0) return;
      s.allEvents = s.allEvents.concat(events);
      const reduced = reduceEvents(s.allEvents);
      setMessages(reduced);
      s.lastSeq = s.allEvents[s.allEvents.length - 1].seq;
      setLastSeq(s.lastSeq);

      // Track oldest loaded seq for paginated "load earlier"
      const oldest = s.allEvents[0]?.seq ?? Infinity;
      setOldestLoadedSeq(oldest);

      const lastEvent = s.allEvents[s.allEvents.length - 1];
      s.isComplete = lastEvent.event === "done" || lastEvent.event === "turn_complete";

      // Cache for instant re-mount
      cacheSet(cid, reduced, s.lastSeq);
    };

    // P2: PAGINATED initial fetch — last 50 events only
    (async () => {
      try {
        const resp = await replayConversationPage(cid, { limit: RECENT_PAGE_SIZE, direction: "newest" });
        if (s.cancelled) return;
        if (resp && resp.events) {
          processBatch(resp.events);
          setHasMoreOlder(!!resp.has_more);
        }
        setLoading(false);

        // If stream not complete, poll for new events every 1.5s up to 60s
        if (!s.isComplete && resp && resp.events.length > 0) {
          setIsResuming(true);
          const poll = async () => {
            if (s.cancelled || s.isComplete) { setIsResuming(false); return; }
            if (Date.now() - s.startTime > 60_000) { setIsResuming(false); return; }
            const more = await replayConversation(cid, s.lastSeq);
            if (more && more.events && more.events.length > 0) {
              processBatch(more.events);
            }
            if (!s.isComplete) pollTimer = setTimeout(poll, 1500);
            else setIsResuming(false);
          };
          pollTimer = setTimeout(poll, 1500);
        }
      } catch (e: any) {
        if (!s.cancelled) {
          setError(e?.message || "Failed to load conversation");
          setLoading(false);
        }
      }
    })();

    return () => {
      s.cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [cid, cacheGet, cacheSeq, cacheSet]);

  return { messages, lastSeq, loading, error, isResuming, hasMoreOlder, loadingOlder, loadOlder };
}

/** Reduces raw SSE events into HydratedMessage[]. */
function reduceEvents(events: ReplayEvent[]): HydratedMessage[] {
  const out: HydratedMessage[] = [];
  let cur: HydratedMessage | null = null;

  const ensureCurrent = (role: "user" | "assistant", seq: number, t: number) => {
    if (cur && cur.role === role) return cur;
    if (cur) out.push(cur);
    cur = {
      id: `${role}-${seq}-${Math.random().toString(36).slice(2, 6)}`,
      role, content: "", parts: [], seq, timestamp: t,
    };
    return cur;
  };

  for (const ev of events) {
    // VPS chat_store may encode data as a JSON string; parse if needed
    let d: any = ev.data;
    if (typeof d === "string") {
      try { d = JSON.parse(d); } catch { d = {}; }
    }
    if (!d || typeof d !== "object") d = {};
    const t = d.type || ev.event;
    if (t === "user_message" || ev.event === "user_message") {
      if (cur) out.push(cur); cur = null;
      const content = d.content || d.text || "";
      out.push({
        id: `user-${ev.seq}`,
        role: "user", content,
        parts: [{ type: "text", text: content }],
        seq: ev.seq, timestamp: ev.t,
      });
    } else if (t === "text") {
      const m = ensureCurrent("assistant", ev.seq, ev.t);
      m.content += d.text || "";
      const last = m.parts[m.parts.length - 1];
      if (last && last.type === "text") last.text += d.text || "";
      else m.parts.push({ type: "text", text: d.text || "" });
    } else if (t === "reasoning" || t === "thinking") {
      const m = ensureCurrent("assistant", ev.seq, ev.t);
      m.parts.push({ type: "reasoning", text: d.text || "" });
    } else if (t === "tool_use" || t === "tool_call") {
      const m = ensureCurrent("assistant", ev.seq, ev.t);
      m.parts.push({
        type: "tool-call",
        toolCallId: d.id || `t${ev.seq}`,
        toolName: d.name || "tool",
        args: d.input || d.args || {},
        status: "running",
      });
    } else if (t === "tool_result") {
      // Find latest tool-call and attach result
      const allMsgs = cur ? [...out, cur] : out;
      for (let i = allMsgs.length - 1; i >= 0; i--) {
        const tc = allMsgs[i].parts.find(
          (p) => p.type === "tool-call" && (p as any).toolCallId === d.id,
        );
        if (tc) {
          (tc as any).result = d.output || d.content || "";
          (tc as any).status = d.is_error ? "incomplete" : "complete";
          break;
        }
      }
    } else if (t === "done" || t === "turn_complete") {
      if (cur) { out.push(cur); cur = null; }
    }
  }
  if (cur) out.push(cur);
  return out;
}
