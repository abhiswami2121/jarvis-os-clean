"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain,
  ChevronDown,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wrench,
} from "lucide-react";
import {
  type ReasoningMessagePartComponent,
  type ToolCallMessagePartComponent,
} from "@assistant-ui/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/* ==========================================================
   REASONING — Polished amber "Thinking" card
   - Auto-opens during streaming, auto-collapses when done
   - Monospace text with proper wrapping, single-line-proof
   - Stable container prevents layout jitter during streaming
   - Amber/gold glow theme matching ThinkingPulse
   ========================================================== */
export function JarvisReasoningView({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming?: boolean;
}) {
  const [open, setOpen] = useState(isStreaming ?? true);
  const prevStreaming = React.useRef(isStreaming);

  React.useEffect(() => {
    if (prevStreaming.current && !isStreaming) {
      // Streaming just finished — auto-collapse after a beat
      const t = setTimeout(() => setOpen(false), 2000);
      return () => clearTimeout(t);
    }
    if (isStreaming && !open) setOpen(true);
    prevStreaming.current = isStreaming;
  }, [isStreaming, open]);

  // Count approximate words for duration hint
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const estSeconds = Math.max(1, Math.round(wordCount / 20));

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="my-2"
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* ── Header: brain + label + pulse dot + duration ── */}
        <CollapsibleTrigger
          className={cn(
            "group/reasoning-trigger flex items-center gap-2 px-3 py-2 rounded-lg w-full",
            "border transition-all duration-300",
            isStreaming
              ? "border-amber-500/20 bg-amber-500/[0.04]"
              : "border-amber-500/[0.08] bg-amber-500/[0.02] hover:border-amber-500/15 hover:bg-amber-500/[0.04]",
          )}
        >
          {/* Animated brain icon */}
          <span className="relative flex items-center justify-center size-4">
            <Brain
              className={cn(
                "size-3.5 transition-colors duration-300",
                isStreaming ? "text-amber-400" : "text-amber-500/70",
              )}
            />
          </span>

          {/* Label */}
          <span
            className={cn(
              "text-xs font-medium transition-colors duration-300",
              isStreaming ? "text-amber-400" : "text-amber-500/70",
            )}
          >
            Thinking
          </span>

          {/* Pulse dot when streaming */}
          {isStreaming && (
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/50" />
              <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
            </span>
          )}

          {/* Duration badge */}
          {!isStreaming && (
            <span className="text-[10px] text-amber-500/40 tabular-nums">
              ~{estSeconds}s
            </span>
          )}

          {/* Spacer */}
          <span className="flex-1" />

          {/* Chevron */}
          <ChevronDown
            className={cn(
              "size-3.5 transition-all duration-300",
              isStreaming ? "text-amber-400/60" : "text-amber-500/30",
              open ? "rotate-0" : "-rotate-90",
            )}
          />
        </CollapsibleTrigger>

        {/* ── Content: monospace, properly wrapped, max-height scroll ── */}
        <CollapsibleContent>
          <div
            className={cn(
              "reasoning-text-container mt-1.5 mx-1 rounded-lg overflow-hidden",
              "border border-amber-500/[0.08]",
              "bg-gradient-to-b from-amber-500/[0.03] to-transparent",
              "max-h-72 overflow-y-auto",
              // Prevent layout jitter during streaming
              "contain-strict",
            )}
            style={{ contain: "strict", contentVisibility: "auto" }}
          >
            <div
              className={cn(
                "px-4 py-3",
                // CRITICAL: prevent single-line overflow with all wrapping modes
                "whitespace-pre-wrap",
                "[word-break:break-word]",
                "overflow-wrap-anywhere",
                // Typography
                "text-xs leading-relaxed",
                "font-mono",
                "text-amber-200/80",
                "selection:bg-amber-500/20 selection:text-amber-100",
                // Subtle left accent line
                "border-l-2 border-amber-500/10 pl-3 ml-1",
              )}
            >
              {text || (
                <span className="text-amber-500/30 italic">
                  Waiting for reasoning…
                </span>
              )}
            </div>

            {/* Bottom fade overlay when scrollable */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#08080f] to-transparent"
              aria-hidden
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}
export const JarvisReasoning = JarvisReasoningView as unknown as ReasoningMessagePartComponent;

/* ==========================================================
   REASONING GROUP — container for grouped reasoning steps
   Each child is a JarvisReasoning with its own collapsible.
   Forces proper monospace wrapping + amber styling on all children.
   ========================================================== */
export function JarvisReasoningGroup({
  children,
  isStreaming,
}: {
  children: React.ReactNode;
  isStreaming?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "my-2 space-y-1.5",
        // Force all descendant text to wrap properly + use monospace
        "[&_*]:!whitespace-pre-wrap",
        "[&_*]:![word-break:break-word]",
        "[&_*]:!overflow-wrap-anywhere",
      )}
      aria-label={isStreaming ? "Jarvis is thinking…" : "Reasoning steps"}
    >
      {children}
    </motion.div>
  );
}

/* ==========================================================
   TOOL CALL — COMPACT inline card (no longer fat)
   - Title row shows: icon + name + arg summary + status badge
   - Collapsed by default unless running
   - Auto-collapses when done
   - Uses Huashu palette: emerald=done, amber=running, red=err, sky=action
   ========================================================== */

type SimpleStatus = "running" | "complete" | "incomplete" | "requires-action";

const statusMeta: Record<SimpleStatus, { icon: React.ElementType; color: string; ring: string; bg: string; badge: string; label: string }> = {
  running:   { icon: Loader2,      color: "text-amber-400",   ring: "ring-amber-500/30",   bg: "bg-amber-500/[0.06]",   badge: "bg-amber-500/15 text-amber-300 ring-amber-500/30",   label: "Running" },
  complete:  { icon: CheckCircle2, color: "text-emerald-400", ring: "ring-emerald-500/25", bg: "bg-emerald-500/[0.05]", badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30", label: "Complete" },
  incomplete:{ icon: XCircle,      color: "text-red-400",     ring: "ring-red-500/40",     bg: "bg-red-500/[0.06]",     badge: "bg-red-500/15 text-red-300 ring-red-500/40",       label: "Error" },
  "requires-action": { icon: AlertCircle, color: "text-sky-400", ring: "ring-sky-500/30", bg: "bg-sky-500/[0.06]", badge: "bg-sky-500/15 text-sky-300 ring-sky-500/30", label: "Action Needed" },
};

function summarizeArgs(args: any, max = 50): string {
  if (!args) return "";
  if (typeof args === "string") return args.slice(0, max);
  try {
    const keys = Object.keys(args);
    if (keys.length === 0) return "";
    const pairs = keys.slice(0, 2).map((k) => {
      const v = args[k];
      const vStr = typeof v === "string" ? `"${v.slice(0, 20)}"` : JSON.stringify(v).slice(0, 25);
      return `${k}=${vStr}`;
    });
    let s = pairs.join(" ");
    if (keys.length > 2) s += ` +${keys.length - 2}`;
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  } catch {
    return "";
  }
}

/** Format result into a compact one-line preview (first ~200 chars) */
function resultPreview(result: any): string {
  if (result === undefined || result === null) return "";
  const text = typeof result === "string" ? result : JSON.stringify(result);
  if (text.length <= 200) return text;
  return text.slice(0, 197) + "…";
}

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
  status: { type: SimpleStatus } | SimpleStatus;
}) {
  const sType: SimpleStatus =
    typeof status === "string" ? status : status?.type ?? "complete";
  const meta = statusMeta[sType];
  const Icon = meta.icon;
  const isRunning = sType === "running";
  const isError = sType === "incomplete";
  const isComplete = sType === "complete";
  // Open by default ONLY while running (so user sees args in flight). Auto-collapses on done.
  const [open, setOpen] = useState(isRunning);
  React.useEffect(() => {
    if (!isRunning) setOpen(false);
  }, [isRunning]);

  const argSummary = summarizeArgs(args);
  const cleanName = toolName.replace(/^mcp__base44_tools__/, "").replace(/^mcp__/, "");
  const preview = isComplete || isError ? resultPreview(result) : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "rounded-lg ring-1 transition-all duration-200",
        meta.ring,
        meta.bg,
        isError && "ring-red-500/60"  // double-emphasis for errors
      )}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* ── Header Row ── */}
        <CollapsibleTrigger className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.03] transition-colors rounded-lg">
          <Icon className={cn("size-3.5 flex-shrink-0", meta.color, isRunning && "animate-spin")} />
          <Wrench className="size-3 text-zinc-500 flex-shrink-0" />
          <span className="text-xs font-mono font-medium text-zinc-200 truncate">{cleanName}</span>
          {argSummary && (
            <span className="text-[10px] font-mono text-zinc-500 truncate flex-1">
              {argSummary}
            </span>
          )}
          {/* Prominent Status Badge */}
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 ring-1",
            meta.badge
          )}>
            {meta.label}
          </span>
          <ChevronDown
            className={cn(
              "size-3 text-zinc-500 transition-transform duration-200 flex-shrink-0",
              open ? "rotate-0" : "-rotate-90"
            )}
          />
        </CollapsibleTrigger>

        {/* ── Expandable Detail ── */}
        <CollapsibleContent>
          <div className="px-3 pb-2.5 space-y-2">
            {/* Args section */}
            {(args || argsText) && (
              <div>
                <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5 font-semibold">Arguments</div>
                <pre className="text-[10px] font-mono text-zinc-400 bg-zinc-900/60 rounded-md p-2.5 overflow-x-auto max-h-32 leading-relaxed border border-zinc-800/50">
{JSON.stringify(args ?? argsText, null, 2)}
                </pre>
              </div>
            )}

            {/* Result section */}
            {result !== undefined && result !== null && (
              <div>
                <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5 font-semibold">
                  {isError ? "Error Detail" : "Result"}
                </div>
                <pre className={cn(
                  "text-[10px] font-mono text-zinc-400 rounded-md p-2.5 overflow-x-auto max-h-52 leading-relaxed whitespace-pre-wrap border",
                  isError
                    ? "bg-red-950/30 border-red-500/20 text-red-300"
                    : "bg-zinc-900/60 border-zinc-800/50"
                )}>
{typeof result === "string" ? result.slice(0, 2500) : JSON.stringify(result, null, 2).slice(0, 2500)}
                </pre>
              </div>
            )}

            {/* Error retry hint */}
            {isError && (
              <div className="flex items-center gap-2 rounded-md bg-red-500/[0.08] border border-red-500/20 px-2.5 py-2">
                <AlertCircle className="size-3.5 text-red-400 flex-shrink-0" />
                <span className="text-[10px] text-red-300">
                  This tool call failed. The agent may retry automatically or ask for clarification.
                </span>
              </div>
            )}
          </div>
        </CollapsibleContent>

        {/* ── Result Preview (visible in collapsed state when done) ── */}
        {preview && !open && (
          <div className={cn(
            "px-3 pb-2 border-t mx-3",
            isError ? "border-red-500/15" : "border-emerald-500/10"
          )}>
            <div className={cn(
              "text-[10px] font-mono leading-relaxed line-clamp-2",
              isError ? "text-red-400/70" : "text-emerald-400/70"
            )}>
              {preview}
            </div>
          </div>
        )}
      </Collapsible>
    </motion.div>
  );
}
export const JarvisToolCall = JarvisToolCallView as unknown as ToolCallMessagePartComponent;

/* ==========================================================
   GROUP — wraps a series of tool calls + reasoning in a compact strip
   ========================================================== */
export function JarvisToolStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-2 space-y-1 border-l-2 border-zinc-800/50 pl-2.5">
      {children}
    </div>
  );
}


/* ==========================================================
   TEXT — wraps streamed text in a stable, motion-friendly div
   Used by thread.tsx for assistant text parts
   ========================================================== */
import { TextMessagePartComponent } from "@assistant-ui/react";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";

export const JarvisText: TextMessagePartComponent = ({ text }) => {
  // Split text into paragraphs for staggered animation
  const paragraphs = text ? text.split(/\n\n+/) : [text];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      aria-live="polite"
      aria-label="Jarvis is typing..."
      className="whitespace-pre-wrap"
    >
      <AnimatePresence mode="popLayout">
        {paragraphs.map((para, i) => (
          <motion.span
            key={`${para.slice(0, 20)}-${i}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: i * 0.03, ease: "easeOut" }}
            style={{ display: i > 0 ? "block" : "inline" }}
          >
            {para}
            {i < paragraphs.length - 1 && "\n\n"}
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
