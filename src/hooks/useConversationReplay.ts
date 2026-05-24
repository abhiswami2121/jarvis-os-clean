"use client";
import { useEffect, useState } from "react";
import { replayConversation, type ReplayEvent } from "@/lib/jarvis-os-client";

export interface HydratedMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  seq: number;
  timestamp: number;
}

/**
 * Replays a conversation from VPS SQLite and reduces SSE events into
 * the assistant-ui message shape. Tool calls and system events are folded
 * into the trailing assistant message (Phase C will surface them as cards).
 */
export function useConversationReplay(cid: string | null) {
  const [messages, setMessages] = useState<HydratedMessage[]>([]);
  const [lastSeq, setLastSeq] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cid) {
      setMessages([]);
      setLastSeq(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    replayConversation(cid, 0)
      .then((res) => {
        if (cancelled) return;
        if (!res || !res.events) {
          setError("Could not load history");
          setLoading(false);
          return;
        }
        const reduced = reduceEvents(res.events);
        setMessages(reduced);
        setLastSeq(res.events.length > 0 ? res.events[res.events.length - 1].seq : 0);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || String(e));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cid]);

  return { messages, lastSeq, loading, error };
}

function reduceEvents(events: ReplayEvent[]): HydratedMessage[] {
  const out: HydratedMessage[] = [];
  let assistantBuffer: HydratedMessage | null = null;

  for (const ev of events) {
    if (ev.event === "message" && ev.data?.role === "user") {
      if (assistantBuffer) {
        out.push(assistantBuffer);
        assistantBuffer = null;
      }
      out.push({
        id: ev.data.id || `seq_${ev.seq}`,
        role: "user",
        content: ev.data.content || "",
        seq: ev.seq,
        timestamp: ev.t,
      });
    } else if (ev.event === "text" && ev.data?.text) {
      if (!assistantBuffer) {
        assistantBuffer = {
          id: `seq_${ev.seq}`,
          role: "assistant",
          content: "",
          seq: ev.seq,
          timestamp: ev.t,
        };
      }
      assistantBuffer.content += ev.data.text;
    } else if (ev.event === "turn_complete" || ev.event === "done") {
      if (assistantBuffer) {
        out.push(assistantBuffer);
        assistantBuffer = null;
      }
    }
    // tool_call_*, system, status events: ignored for now (Phase C surfaces them)
  }
  if (assistantBuffer) out.push(assistantBuffer);
  return out;
}
