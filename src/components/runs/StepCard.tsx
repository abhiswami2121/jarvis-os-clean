"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Wrench, FileText, Terminal, Globe, AlertCircle } from "lucide-react";

export interface StepData {
  seq: number;
  type: string;
  name?: string;
  input?: Record<string, unknown>;
  text?: string;
  status?: "ok" | "error" | "pending";
}

function toolIcon(name: string) {
  const n = name?.toLowerCase() || "";
  if (n.includes("bash")) return <Terminal className="size-3.5 text-amber-400" />;
  if (n.includes("read") || n.includes("write") || n.includes("edit") || n.includes("fs_"))
    return <FileText className="size-3.5 text-blue-400" />;
  if (n.includes("mcp")) return <Wrench className="size-3.5 text-purple-400" />;
  if (n.includes("web")) return <Globe className="size-3.5 text-emerald-400" />;
  return <Wrench className="size-3.5 text-zinc-400" />;
}

function statusColor(status?: string) {
  if (status === "error") return "border-red-500/40 bg-red-500/5";
  if (status === "ok") return "border-emerald-500/30 bg-emerald-500/5";
  return "border-zinc-700/50 bg-zinc-900/20";
}

export function StepCard({ step }: { step: StepData }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = step.input && Object.keys(step.input).length > 0;

  return (
    <div
      className={`group border rounded-lg px-3 py-2.5 transition-all ${statusColor(step.status)} hover:border-zinc-600/60`}
    >
      {/* Header row - always visible */}
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left"
      >
        <span className="text-[10px] text-zinc-600 w-8 shrink-0 tabular-nums">
          #{step.seq}
        </span>

        <span className="shrink-0">
          {toolIcon(step.name || step.type)}
        </span>

        <span className="text-xs font-medium text-zinc-300 truncate flex-1">
          {step.name || step.type}
        </span>

        {step.text && (
          <span className="text-[11px] text-zinc-500 truncate max-w-[200px] hidden sm:block">
            {step.text.slice(0, 80)}
          </span>
        )}

        {hasDetails && (
          <span className="text-zinc-600">
            {expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </span>
        )}

        {step.status === "error" && (
          <AlertCircle className="size-3.5 text-red-400 shrink-0" />
        )}
      </button>

      {/* Expanded details */}
      {expanded && step.input && (
        <div className="mt-2 pl-14 pr-2">
          <pre className="text-[11px] text-zinc-400 bg-zinc-900/60 rounded-md p-2.5 overflow-x-auto max-h-48 border border-zinc-800/50">
            {JSON.stringify(step.input, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
