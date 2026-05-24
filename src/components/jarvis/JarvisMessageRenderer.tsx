"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Brain,
  ChevronDown,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  type ReasoningMessagePartComponent,
  type ToolCallMessagePartComponent,
} from "@assistant-ui/react";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────
   Reasoning Part — subtle gray italic collapsible block
   ────────────────────────────────────────────────────────── */

export function JarvisReasoningView({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          <Brain className="size-3.5" />
          <span className="italic">Reasoning</span>
          <ChevronDown
            className={cn(
              "size-3 transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1.5 rounded-md bg-zinc-900/50 border border-zinc-800/50 px-3 py-2 text-xs text-zinc-400 italic leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

export const JarvisReasoning = JarvisReasoningView as unknown as ReasoningMessagePartComponent;

/* ──────────────────────────────────────────────────────────
   Tool-Call Part — collapsible card with icon, status badge,
   and JSON args/result
   ────────────────────────────────────────────────────────── */

type SimpleStatus = "running" | "complete" | "incomplete" | "requires-action";

const statusMeta: Record<
  SimpleStatus,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  running: {
    icon: Loader2,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    label: "Running",
  },
  complete: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    label: "Done",
  },
  incomplete: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    label: "Error",
  },
  "requires-action": {
    icon: AlertCircle,
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
    label: "Action needed",
  },
};

export function JarvisToolCallView({
  toolName,
  args,
  argsText,
  result,
  status,
}: {
  toolName: string;
  args?: Record<string, any>;
  argsText?: string;
  result?: any;
  status: { type: SimpleStatus };
}) {
  const [open, setOpen] = useState(status.type === "running");
  const sType = status.type ?? "complete";
  const meta = statusMeta[sType];
  const Icon = meta.icon;
  const isRunning = sType === "running";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="my-2"
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          className={cn(
            "w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
            meta.bg
          )}
        >
          <Icon
            className={cn(
              "size-4 shrink-0",
              isRunning && "animate-spin",
              meta.color
            )}
          />
          <span className="font-medium text-zinc-200">{toolName}</span>
          <span
            className={cn(
              "ml-auto text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded",
              meta.color,
              "bg-black/20"
            )}
          >
            {meta.label}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-zinc-500 transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-2 rounded-b-lg bg-zinc-950/50 border border-t-0 border-zinc-800/50 px-3 py-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Arguments
              </div>
              <pre className="text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono">
                {argsText || JSON.stringify(args, null, 2)}
              </pre>
            </div>
            {result !== undefined && (
              <div className="border-t border-zinc-800/50 pt-2">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Result
                </div>
                <pre className="text-xs text-emerald-300/90 overflow-x-auto whitespace-pre-wrap font-mono">
                  {typeof result === "string"
                    ? result
                    : JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

export const JarvisToolCall = JarvisToolCallView as unknown as ToolCallMessagePartComponent;

/* ──────────────────────────────────────────────────────────
   Text Part — smooth fade-in while streaming
   ────────────────────────────────────────────────────────── */

export function JarvisText() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <MarkdownText />
    </motion.div>
  );
}
