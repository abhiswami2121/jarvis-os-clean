"use client";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Circle, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface LifecycleStep {
  label: string;
  status: "complete" | "active" | "pending" | "error";
  timestamp?: string;
  detail: string;
  detailLines?: string[];
}

interface Props {
  taskId: string;
}

const VPS_URL = "http://187.127.250.171:8102";
const TOKEN = "NL2026061471";

export function LifecycleDashboard({ taskId }: Props) {
  const [task, setTask] = useState<any>(null);
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch task data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        const data = await res.json();
        setTask(data.task);
      } catch (e) {
        // task not found or error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [taskId, refreshKey]);

  // Poll session status
  useEffect(() => {
    if (!task?.agent_session_id) return;
    let active = true;

    async function poll() {
      while (active) {
        try {
          const res = await fetch(`${VPS_URL}/v1/sessions/${task.agent_session_id}`, {
            headers: { Authorization: `Bearer ${TOKEN}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (active) setSessionStatus(data);
            if (data.status !== "running") break;
          }
        } catch (e) {
          // retry next cycle
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    poll();
    return () => { active = false; };
  }, [task?.agent_session_id]);

  const steps = buildSteps(task, sessionStatus);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 text-sm p-4">
        <Loader2 className="size-4 animate-spin" />
        Loading lifecycle...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-zinc-500 text-sm p-4">Task not found</div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a14] overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/[0.05] px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Task Lifecycle</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">{taskId}</p>
        </div>
        {task.agent_session_id && (
          <a
            href={`https://jarvis-os-clean.vercel.app/runs/${task.agent_session_id}`}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>Live view</span>
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      {/* Steps */}
      <div className="p-4 space-y-1">
        {steps.map((step, i) => (
          <div key={i} className="relative">
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className={cn(
                "absolute left-[11px] top-6 bottom-0 w-px",
                step.status === "complete" ? "bg-emerald-500/30" : "bg-white/[0.05]"
              )} />
            )}

            <div className="flex gap-3 py-1.5">
              {/* Icon */}
              <div className="relative z-10 mt-0.5">
                {step.status === "complete" && <CheckCircle className="size-[22px] text-emerald-400" />}
                {step.status === "active" && <Loader2 className="size-[22px] text-emerald-400 animate-spin" />}
                {step.status === "error" && <AlertCircle className="size-[22px] text-red-400" />}
                {step.status === "pending" && <Circle className="size-[22px] text-zinc-700" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-xs font-medium",
                  step.status === "complete" ? "text-zinc-300" :
                  step.status === "active" ? "text-emerald-400" :
                  step.status === "error" ? "text-red-400" : "text-zinc-600"
                )}>
                  {step.label}
                </div>
                <div className="text-[11px] text-zinc-600 mt-0.5">{step.detail}</div>
                {step.detailLines?.map((line, j) => (
                  <div key={j} className="text-[10px] text-zinc-700 mt-0.5 font-mono">{line}</div>
                ))}
              </div>

              {/* Timestamp */}
              {step.timestamp && (
                <div className="text-[10px] text-zinc-700 shrink-0 mt-0.5 font-mono">
                  {step.timestamp}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cost estimate */}
      {sessionStatus && (
        <div className="border-t border-white/[0.05] px-4 py-2.5 flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Cost estimate</span>
          <span className="text-zinc-400 font-mono">
            ${estimateCost(sessionStatus).toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}

function buildSteps(task: any, session: any): LifecycleStep[] {
  const steps: LifecycleStep[] = [];

  // Step 1: Created
  steps.push({
    label: "1. Task created",
    status: "complete",
    timestamp: task.created_at ? formatTime(task.created_at) : undefined,
    detail: `id: ${task.id || "—"}`,
    detailLines: [`prompt: "${(task.prompt || "").slice(0, 60)}..."`],
  });

  // Step 2: Routing resolved
  const routingResolved = !!task.resolved_model;
  steps.push({
    label: "2. Routing resolved",
    status: routingResolved ? "complete" : (task.status === "routing" ? "active" : "pending"),
    timestamp: task.updated_at ? formatTime(task.updated_at) : undefined,
    detail: routingResolved
      ? `${task.routing_mode} · ${task.resolved_provider}`
      : "Pending...",
    detailLines: routingResolved ? [
      `model: ${task.resolved_model}`,
      `base_url: ${task.resolved_base_url || "—"}`,
      `key: ${task.resolved_key_prefix || "***"}`,
    ] : [],
  });

  // Step 3: Dispatched to backend
  const dispatched = task.status === "dispatched" || task.status === "running" || task.status === "completed";
  steps.push({
    label: "3. Backend dispatched",
    status: dispatched ? "complete" : "pending",
    timestamp: task.updated_at ? formatTime(task.updated_at) : undefined,
    detail: dispatched
      ? `POST neptune.newleaf.financial/v1/tasks`
      : "Awaiting dispatch...",
    detailLines: task.agent_session_id
      ? [`session_id: ${task.agent_session_id}`]
      : [],
  });

  // Step 4: Agent running
  const isRunning = task.status === "running";
  const isDone = task.status === "completed" || task.status === "error";
  steps.push({
    label: "4. Agent running",
    status: isDone ? "complete" : isRunning ? "active" : "pending",
    detail: isRunning
      ? "Processing..."
      : isDone
        ? "Session complete"
        : "Awaiting agent...",
    detailLines: session ? [
      `tools_used: ${session.tool_call_count || 0}`,
      `tokens_in: ${formatK(session.token_count_in)} out: ${formatK(session.token_count_out)}`,
      `cost_estimate: $${estimateCost(session).toFixed(4)}`,
    ] : [],
  });

  // Step 5: Completion status
  if (task.status === "completed") {
    steps.push({
      label: "5. Completed ✓",
      status: "complete",
      timestamp: task.completed_at ? formatTime(task.completed_at) : undefined,
      detail: "Task finished successfully",
    });
  } else if (task.status === "error") {
    steps.push({
      label: "5. Error ✗",
      status: "error",
      detail: task.error || "Unknown error",
    });
  } else {
    steps.push({
      label: "5. Awaiting completion",
      status: isRunning ? "active" : "pending",
      detail: isRunning ? "Waiting for agent to finish..." : "Pending...",
    });
  }

  return steps;
}

function estimateCost(session: any): number {
  const toolCalls = session?.tool_call_count || 0;
  // Rough estimate: gateway models ~$0.003/tool call for deepseek, $0.008 for claude
  const avgCostPerCall = 0.005;
  return toolCalls * avgCostPerCall;
}

function formatTime(ts: string | number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatK(n: number | undefined): string {
  if (!n) return "0";
  if (n < 1000) return String(n);
  return (n / 1000).toFixed(1) + "K";
}
