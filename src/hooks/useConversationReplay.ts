"use client";
import { useEffect, useState, useRef } from "react";
import { replayConversation, type ReplayEvent } from "@/lib/jarvis-os-client";

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

/**
 * Replays a conversation from VPS SQLite and reduces SSE events into
 * the assistant-ui message shape. Handles text, reasoning, tool calls,
 * tool results, errors, and turn boundaries.
 *
 * If the stream is incomplete (no done/turn_complete), polls every 1.5s
 * for up to 60s to catch in-flight responses after route changes.
 */
export function useConversationReplay(cid: string | null) {
  const [messages, setMessages] = useState<HydratedMessage[]>([]);
  const [lastSeq, setLastSeq] = useState(0);
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

  useEffect(() => {
    if (!cid) {
      setMessages([]);
      setLastSeq(0);
      setLoading(false);
      setError(null);
      setIsResuming(false);
      return;
    }

    const s = stateRef.current;
    s.allEvents = [];
    s.lastSeq = 0;
    s.isComplete = false;
    s.startTime = Date.now();
    s.cancelled = false;

    let pollTimer: ReturnType<typeof setTimeout>;
    setLoading(true);
    setIsResuming(false);

    const processBatch = (events: ReplayEvent[]) => {
      if (s.cancelled || events.length === 0) return;
      s.allEvents = s.allEvents.concat(events);
      const reduced = reduceEvents(s.allEvents);
      setMessages(reduced);
      s.lastSeq = s.allEvents[s.allEvents.length - 1].seq;
      setLastSeq(s.lastSeq);

      const lastEvent = s.allEvents[s.allEvents.length - 1];
      s.isComplete =
        lastEvent.event === "done" || lastEvent.event === "turn_complete";
      setIsResuming(!s.isComplete);
    };

    const schedulePoll = () => {
      if (s.cancelled || s.isComplete) return;
      if (Date.now() - s.startTime > 60000) {
        setIsResuming(false);
        return;
      }

      pollTimer = setTimeout(async () => {
        if (s.cancelled) return;
        try {
          const res = await replayConversation(cid, s.lastSeq);
          if (res && res.events && res.events.length > 0) {
            processBatch(res.events);
          }
          schedulePoll();
        } catch {
          // Stop polling on error but don't surface it
          setIsResuming(false);
        }
      }, 1500);
    };

    replayConversation(cid, 0)
      .then((res) => {
        if (s.cancelled) return;
        if (!res || !res.events) {
          setError("Could not load history");
          setLoading(false);
          setIsResuming(false);
          return;
        }
        processBatch(res.events);
        setError(null);
        setLoading(false);

        if (!s.isComplete) {
          schedulePoll();
        }
      })
      .catch((e) => {
        if (s.cancelled) return;
        setError(e?.message || String(e));
        setLoading(false);
        setIsResuming(false);
      });

    return () => {
      s.cancelled = true;
      clearTimeout(pollTimer);
    };
  }, [cid]);

  return { messages, lastSeq, loading, error, isResuming };
}

function createAssistantBuffer(seq: number, t: number): HydratedMessage {
  return {
    id: `seq_${seq}`,
    role: "assistant",
    content: "",
    parts: [],
    seq,
    timestamp: t,
  };
}

function reduceEvents(events: ReplayEvent[]): HydratedMessage[] {
  const out: HydratedMessage[] = [];
  let assistantBuffer: HydratedMessage | null = null;

  for (const ev of events) {
    const type = ev.event;

    if (type === "message" && ev.data?.role === "user") {
      if (assistantBuffer) {
        out.push(assistantBuffer);
        assistantBuffer = null;
      }
      const text = ev.data.content || "";
      out.push({
        id: ev.data.id || `seq_${ev.seq}`,
        role: "user",
        content: text,
        parts: [{ type: "text", text }],
        seq: ev.seq,
        timestamp: ev.t,
      });
    } else if (type === "text" && ev.data?.text) {
      if (!assistantBuffer) {
        assistantBuffer = createAssistantBuffer(ev.seq, ev.t);
      }
      assistantBuffer.content += ev.data.text;
      const last = assistantBuffer.parts[assistantBuffer.parts.length - 1];
      if (last && last.type === "text") {
        last.text += ev.data.text;
      } else {
        assistantBuffer.parts.push({ type: "text", text: ev.data.text });
      }
    } else if (type === "reasoning" || type === "thinking") {
      if (!assistantBuffer) {
        assistantBuffer = createAssistantBuffer(ev.seq, ev.t);
      }
      const text = ev.data?.text || "";
      const last = assistantBuffer.parts[assistantBuffer.parts.length - 1];
      if (last && last.type === "reasoning") {
        last.text += text;
      } else {
        assistantBuffer.parts.push({ type: "reasoning", text });
      }
    } else if (type === "tool_use" || type === "tool_call") {
      if (!assistantBuffer) {
        assistantBuffer = createAssistantBuffer(ev.seq, ev.t);
      }
      assistantBuffer.parts.push({
        type: "tool-call",
        toolCallId: ev.data?.id || `t${assistantBuffer.parts.length}`,
        toolName: ev.data?.name || "tool",
        args: ev.data?.input || ev.data?.args || {},
        status: "running",
      });
    } else if (type === "tool_result") {
      if (assistantBuffer) {
        const tc = assistantBuffer.parts.find(
          (p): p is Extract<MessagePart, { type: "tool-call" }> =>
            p.type === "tool-call" && p.toolCallId === ev.data?.id
        );
        if (tc) {
          tc.result = ev.data?.output || ev.data?.content || "";
          tc.status = ev.data?.is_error ? "incomplete" : "complete";
        }
      }
    } else if (type === "error") {
      if (!assistantBuffer) {
        assistantBuffer = createAssistantBuffer(ev.seq, ev.t);
      }
      const errText = `\n\n⚠ Error: ${ev.data?.error || "unknown"}`;
      assistantBuffer.content += errText;
      assistantBuffer.parts.push({ type: "text", text: errText });
    } else if (type === "turn_complete" || type === "done") {
      if (assistantBuffer) {
        out.push(assistantBuffer);
        assistantBuffer = null;
      }
    }
  }

  if (assistantBuffer) out.push(assistantBuffer);
  return out;
}
