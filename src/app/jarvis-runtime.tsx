"use client";

import React from "react";
import { useLocalRuntime, type ChatModelAdapter, AssistantRuntimeProvider } from "@assistant-ui/react";
import { toast } from "sonner";
import { useSessionStore } from "@/lib/session-store";

const LS_MODEL = "jarvis-os:model:v1";
const LS_SESSION = "jarvis-os:session:v1";
const LS_CID = "jarvis-os:cid:v1";  // stable conversation id per browser/tab

function getOrCreateCid(): string {
  if (typeof window === "undefined") return "";

  // Prefer URL param when on /chat/[id] so switching conversations works
  const match = window.location.pathname.match(/^\/chat\/([^/]+)/);
  if (match) {
    const urlCid = decodeURIComponent(match[1]);
    sessionStorage.setItem(LS_CID, urlCid);
    return urlCid;
  }

  let cid = sessionStorage.getItem(LS_CID);
  if (!cid) {
    cid = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(LS_CID, cid);
  }
  return cid;
}

export function setConversationId(cid: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LS_CID, cid);
}

export function resetConversation() {
  if (typeof window !== "undefined") sessionStorage.removeItem(LS_CID);
}

function loadModel(): string {
  if (typeof window === "undefined") return "deepseek-v4-pro";
  return localStorage.getItem(LS_MODEL) || "deepseek-v4-pro";
}

async function consumeSse(reader: ReadableStreamDefaultReader<Uint8Array>, onEvent: (name: string, data: any) => void) {
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const part of parts) {
      if (!part.trim() || part.startsWith(":")) continue;
      const lines = part.split("\n");
      let evName = "message";
      let dataLine = "";
      for (const line of lines) {
        if (line.startsWith("event:")) evName = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLine = line.slice(5).trim();
      }
      if (!dataLine) continue;
      try { onEvent(evName, JSON.parse(dataLine)); } catch { /* ignore */ }
    }
  }
}

function flattenMessages(messages: any[]) {
  return messages.map((m) => {
    let text = "";
    if (typeof m.content === "string") text = m.content;
    else if (Array.isArray(m.content)) {
      for (const part of m.content) {
        if (part?.type === "text" && part.text) text += part.text;
      }
    }
    return { role: m.role, content: text };
  });
}

const JarvisAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const model = loadModel();
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: flattenMessages(messages as any), profile: model, conversation_id: getOrCreateCid() }),
      signal: abortSignal,
    });

    if (!res.ok) {
      toast.error(`Jarvis unreachable: HTTP ${res.status}`, { description: "Check VPS connection or try again" });
      yield { content: [{ type: "text", text: `⚠ Connection failed (HTTP ${res.status}). Retry in a moment.` }] };
      return;
    }
    if (!res.body) {
      toast.error("No response stream", { description: "Jarvis returned an empty body" });
      yield { content: [{ type: "text", text: "⚠ No response stream from VPS" }] };
      return;
    }

    let activeSid: string | null = null;
    const cancelOnAbort = () => {
      if (activeSid) {
        fetch(`/api/agent?sid=${encodeURIComponent(activeSid)}`, { method: "DELETE" }).catch(() => {});
      }
    };
    if (abortSignal) {
      if (abortSignal.aborted) cancelOnAbort();
      else abortSignal.addEventListener("abort", cancelOnAbort, { once: true });
    }
    const reader = res.body.getReader();
    let accumulatedText = "";
    let reasoningText = "";
    const toolCalls: any[] = [];
    let sessionId: string | null = null;
    let lastYield = 0;
    let receivedDone = false;

    const buildContent = (): any[] => {
      const content: any[] = [];
      if (reasoningText) content.push({ type: "reasoning", text: reasoningText });
      for (const tc of toolCalls) content.push(tc);
      if (accumulatedText) content.push({ type: "text", text: accumulatedText });
      if (content.length === 0) content.push({ type: "text", text: "" });
      return content;
    };

    const events: Array<{ name: string; data: any }> = [];
    let consumerDone = false;
    consumeSse(reader, (name, data) => events.push({ name, data }))
      .catch(() => {})
      .finally(() => { consumerDone = true; });

    while (!consumerDone || events.length > 0) {
      if (events.length === 0) {
        await new Promise(r => setTimeout(r, 25));
        continue;
      }
      const ev = events.shift()!;
      const { name, data } = ev;
      const type = data.type || name;

      if (type === "session" && data.session_id) {
        sessionId = String(data.session_id);
        activeSid = sessionId;
        if (typeof window !== "undefined") localStorage.setItem(LS_SESSION, sessionId);
      } else if (type === "system" && data.session_id) {
        sessionId = data.session_id;
        activeSid = sessionId;
        if (typeof window !== "undefined") localStorage.setItem(LS_SESSION, sessionId!);
      } else if (type === "text") {
        accumulatedText += data.text || "";
      } else if (type === "reasoning" || type === "thinking") {
        reasoningText += data.text || "";
      } else if (type === "tool_use" || type === "tool_call") {
        toolCalls.push({
          type: "tool-call",
          toolCallId: data.id || `t${toolCalls.length}`,
          toolName: data.name || "tool",
          args: data.input || data.args || {},
          status: { type: "running" },
        });
      } else if (type === "tool_result") {
        const tc = toolCalls.find((t) => t.toolCallId === data.id);
        if (tc) {
          tc.result = data.output || data.content || "";
          tc.status = { type: data.is_error ? "incomplete" : "complete" };
        }
      } else if (type === "canvas_synthesis") {
        // May 27 PRD: canvas_synthesis is a signal event only.
        // NO markdown appended to accumulatedText — canvas renders via tool_call inline card.
        // The create_slack_canvas tool_call event drives the frontend makeAssistantToolUI intercept.
        // Keep for backwards-compat: if tool_call_id is present, skip; else log.
        if (data.tool_call_id) {
          // tool_call already emitted — nothing to do here
        } else if (data.markdown) {
          // Legacy path — but prefer tool_call
          if (accumulatedText && !accumulatedText.endsWith("\n\n")) accumulatedText += "\n\n";
          accumulatedText += data.markdown;
        }
        // NO slack_url link injection — side-sheet handles navigation
      } else if (type === "canvas") {
        // Phase 1 Canvas: open canvas overlay via zustand store
        // Format: { type:"canvas", action:"open", template:"weekly-digest", data:{...}, title:"..." }
        if (data.action === "open" && typeof window !== "undefined") {
          try {
            const { useCanvasStore } = await import("@/lib/stores/canvas-store");
            useCanvasStore.getState().open({
              template: data.template ?? "generic",
              data: data.data ?? {},
              title: data.title,
            });
          } catch (e) {
            console.warn("[canvas] failed to open canvas overlay:", e);
          }
        }
      } else if (type === "canvas_url") {
        // Phase 1 Canvas: shareable URL
        // Format: { type:"canvas_url", action:"share", url:"https://...", canvasId:"abc123" }
        if (data.action === "share" && data.url && typeof window !== "undefined") {
          try {
            const { useCanvasStore } = await import("@/lib/stores/canvas-store");
            useCanvasStore.getState().setUrl(data.url);
            // Also copy to clipboard for quick sharing
            if (navigator.clipboard) {
              navigator.clipboard.writeText(data.url).catch(() => {});
            }
          } catch (e) {
            console.warn("[canvas_url] failed to set url:", e);
          }
        }
      } else if (type === "error") {
        accumulatedText += `\n\n⚠ Error: ${data.error || "unknown"}`;
      } else if (type === "done") {
        receivedDone = true;
        if (typeof window !== "undefined") localStorage.removeItem(LS_SESSION);
      } else if (type === "keepalive" || type === "heartbeat") {
        // Heartbeat — keep stream alive, no content change needed
        continue;
      }

      const now = Date.now();
      if (now - lastYield > 50) {
        yield { content: buildContent() };
        lastYield = now;
      }
    } // end while loop

    yield { content: buildContent() };

    // Stream ended — check if it was clean or unexpected
    if (!receivedDone && accumulatedText) {
      // Stream ended without a "done" event — likely timeout or disconnect
      toast.warning("Stream paused — refresh if you need more", {
        description: "Jarvis may still be working. Refresh to continue.",
        duration: 10000,
        id: "stream-paused",
      });
    } else if (receivedDone) {
      toast.dismiss("stream-paused");
    }

    // PERSIST FINAL MESSAGE TO SESSION-STORE for ConversationHydrator survival on refresh
    try {
      const final = buildContent();
      const hasContent = final.some((p: any) =>
        (p.type === "text" && p.text) ||
        (p.type === "reasoning" && p.text)
      );
      if (hasContent) {
        const cid = getOrCreateCid();
        const store = useSessionStore.getState();
        const existing = store.getCachedMessages(cid) || [];
        store.cacheMessages(cid, [...existing, {
          id: `asst-stream-${Date.now()}`,
          role: "assistant" as const,
          content: accumulatedText,
          parts: final.map((p: any) => {
            if (p.type === "tool-call") return {
              type: "tool-call" as const,
              toolCallId: p.toolCallId,
              toolName: p.toolName,
              args: p.args,
              result: p.result,
              status: typeof p.status?.type === "string" ? p.status.type : "complete",
            };
            return p;
          }),
          seq: Date.now(),
          timestamp: Date.now() / 1000,
        }], Date.now());
      }
    } catch { /* non-critical — best-effort cache */ }
  },
};

export function JarvisRuntimeProvider({ children, conversationId }: { children: React.ReactNode; conversationId?: string }) {
  // Seed sessionStorage with URL-provided conversationId so the adapter picks it up on first POST
  React.useEffect(() => {
    if (conversationId && typeof window !== "undefined") {
      sessionStorage.setItem(LS_CID, conversationId);
    }
  }, [conversationId]);
  const runtime = useLocalRuntime(JarvisAdapter);
  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
}

export { LS_MODEL };
