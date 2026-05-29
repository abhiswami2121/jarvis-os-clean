"use client";
import type { ThreadMessageLike } from "@assistant-ui/react";
import type { HydratedMessage, MessagePart } from "@/hooks/useConversationReplay";

/**
 * BUG B FIX — ONE RENDERER.
 *
 * Pure mapper: persisted VPS history (HydratedMessage[], produced by the proven
 * useConversationReplay reducer) -> assistant-ui ThreadMessageLike[], so it can
 * seed useLocalRuntime({ initialMessages }). This makes the SAME <Thread> render
 * BOTH history and the live stream — eliminating the "different vibrant UI on
 * refresh" divergence where ConversationHydrator used its own component set.
 *
 * No fetching here — the page owns the useConversationReplay hook and passes the
 * already-reduced messages in. We never re-implement the events->message reducer.
 */
function partToThreadPart(p: MessagePart): any {
  if (p.type === "text") return { type: "text", text: p.text || "" };
  if (p.type === "reasoning") return { type: "reasoning", text: p.text || "" };
  if (p.type === "tool-call") {
    return {
      type: "tool-call",
      toolCallId: p.toolCallId,
      toolName: p.toolName,
      args: p.args || {},
      result: p.result,
    };
  }
  return { type: "text", text: "" };
}

export function toThreadMessages(history: HydratedMessage[]): ThreadMessageLike[] {
  if (!history || history.length === 0) return [];
  return history.map((m) => {
    const role = m.role === "system" ? "assistant" : m.role;
    const parts = (m.parts && m.parts.length > 0)
      ? m.parts.map(partToThreadPart)
      : [{ type: "text", text: m.content || "" }];
    return { role, content: parts as any };
  });
}
