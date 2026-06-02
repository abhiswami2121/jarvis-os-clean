"use client";

import { StepCard, StepData } from "./StepCard";

interface RunDetailPaneProps {
  conversation: {
    id: string;
    user_email: string;
    title: string;
    created_at: number;
    updated_at: number;
    last_seq: number;
  } | null;
  replay: {
    events: Array<{
      seq: number;
      event_type: string;
      data: string | Record<string, unknown>;
      timestamp: number;
    }>;
  } | null;
  loading: boolean;
}

type ReplayEvent = {
  seq: number;
  event_type: string;
  data: string | Record<string, unknown>;
  timestamp: number;
};

function parseEventToStep(event: ReplayEvent): StepData {
  const data = typeof event.data === "string" ? tryParseJSON(event.data) : event.data || {};
  const step: StepData = {
    seq: event.seq,
    type: event.event_type,
    status: "ok",
  };

  if (event.event_type === "tool_use" && typeof data === "object" && data !== null) {
    step.name = (data as Record<string, unknown>).name as string;
    step.input = (data as Record<string, unknown>).input as Record<string, unknown>;
  } else if (event.event_type === "tool_result" && typeof data === "object" && data !== null) {
    step.name = "tool_result";
    step.text = typeof (data as Record<string, unknown>).content === "string"
      ? ((data as Record<string, unknown>).content as string).slice(0, 200)
      : "result";
    if ((data as Record<string, unknown>).is_error) step.status = "error";
  } else if (event.event_type === "text" && typeof data === "object" && data !== null) {
    step.name = "assistant";
    step.text = ((data as Record<string, unknown>).text as string) || "";
  } else if (event.event_type === "reasoning" && typeof data === "object" && data !== null) {
    step.name = "reasoning";
    step.text = ((data as Record<string, unknown>).text as string)?.slice(0, 200) || "";
  } else if (event.event_type === "message" && typeof data === "object" && data !== null) {
    step.name = (data as Record<string, unknown>).role as string || "message";
    step.text = ((data as Record<string, unknown>).content as string)?.slice(0, 200) || "";
  } else {
    step.name = event.event_type;
  }

  return step;
}

function tryParseJSON(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function relativeTime(ts: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - ts;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function RunDetailPane({ conversation, replay, loading }: RunDetailPaneProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="size-4 border-2 border-zinc-600 border-t-emerald-400 rounded-full animate-spin" />
          <span className="text-sm">Loading events...</span>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
        Select a session from the list to view details
      </div>
    );
  }

  const steps: StepData[] = replay?.events?.map(parseEventToStep) || [];

  return (
    <div className="h-full flex flex-col">
      {/* Session header */}
      <div className="px-4 py-3 border-b border-zinc-800/50 shrink-0">
        <h2 className="text-sm font-semibold text-zinc-100 truncate">
          {conversation.title || conversation.id}
        </h2>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-500">
          <span>{conversation.id}</span>
          <span>·</span>
          <span>{relativeTime(conversation.created_at)}</span>
          <span>·</span>
          <span>{conversation.last_seq} events</span>
          <span>·</span>
          <span className="text-zinc-600">{conversation.user_email}</span>
        </div>
      </div>

      {/* Step list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {steps.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-8">
            No events found for this session
          </div>
        ) : (
          steps.map((step, i) => (
            <StepCard key={`${step.seq}-${i}`} step={step} />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-2 border-t border-zinc-800/50 shrink-0">
        <div className="flex items-center gap-4 text-[10px] text-zinc-600">
          <span>{steps.length} steps</span>
          <span>
            {steps.filter((s) => s.type === "tool_use").length} tool uses
          </span>
          <span>
            {steps.filter((s) => s.status === "error").length} errors
          </span>
        </div>
      </div>
    </div>
  );
}
