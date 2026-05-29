"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, AlertCircle, ChevronDown, ChevronUp, History, Wrench, CheckCircle2, XCircle } from "lucide-react";
import { useConversationReplay, type HydratedMessage, type MessagePart } from "@/hooks/useConversationReplay";
import { JarvisReasoningView } from "@/components/jarvis/JarvisMessageRenderer";
import { parseArtifacts } from "@/lib/artifacts/parser";
import { ArtifactList } from "@/components/artifacts/ArtifactRouter";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import { defaultComponents } from "@/components/assistant-ui/markdown-text";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * CONTEXT REPAIR — prior conversation is now EXPANDED BY DEFAULT.
 *
 * The Versailles collapse behavior was a regression: users couldn't see their
 * past messages without clicking a pill. Now prior messages render inline
 * immediately when navigating to a conversation. Collapse button preserved
 * for users who prefer a clean canvas.
 *
 * "Load earlier" button appears at top when hasMoreOlder=true.
 */
export function ConversationHydrator({ cid }: { cid: string | null }) {
  const { messages, loading, error, isResuming, hasMoreOlder, loadingOlder, loadOlder } = useConversationReplay(cid);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (isResuming) toast.loading("Resuming conversation…", { id: "resume-toast", duration: 60000 });
    else toast.dismiss("resume-toast");
  }, [isResuming]);

  if (!cid) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-xs text-zinc-500">
        <Loader2 className="size-3.5 animate-spin" /> Loading conversation…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl my-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-4 py-3 text-xs text-amber-200 flex items-start gap-2">
        <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-medium">Couldn’t load history</div>
          <div className="text-amber-300/70 mt-0.5">{error}</div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-2">
      {/* COLLAPSED state: minimal pill (no DOM bloat) */}
      {!expanded ? (
        <motion.button
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setExpanded(true)}
          className="mx-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 hover:border-white/20 transition-all"
        >
          <History className="size-3.5" />
          <span>{messages.length} earlier message{messages.length === 1 ? "" : "s"}</span>
          <ChevronDown className="size-3.5" />
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3 overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ChevronUp className="size-3" />
              Collapse history
            </button>
            <span className="text-[10px] uppercase tracking-widest text-zinc-600">
              {messages.length} messages
            </span>
          </div>

          {/* Load earlier button at top */}
          {hasMoreOlder && (
            <div className="flex justify-center">
              <button
                onClick={loadOlder}
                disabled={loadingOlder}
                className="text-xs text-zinc-400 hover:text-zinc-100 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {loadingOlder ? (
                  <><Loader2 className="size-3 animate-spin" /> Loading…</>
                ) : (
                  "Load earlier messages"
                )}
              </button>
            </div>
          )}

          {messages.map((m, idx) => (
            <MessageBubble key={m.id} message={m} index={idx} />
          ))}
          {isResuming && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-emerald-400">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Resuming stream…</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-2 text-[10px] uppercase tracking-widest text-zinc-600">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-500/30" />
            <span className="text-emerald-400/70">Live below</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-500/30" />
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MessageBubble({ message, index }: { message: HydratedMessage; index: number }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isUser
          ? "bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 text-zinc-100"
          : "bg-white/[0.03] border border-white/[0.06] text-zinc-200"
      }`}>
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <AssistantParts parts={message.parts} />
        )}
      </div>
    </motion.div>
  );
}

function AssistantParts({ parts }: { parts: MessagePart[] }) {
  return (
    <div className="space-y-1.5">
      {parts.map((p, i) => {
        if (p.type === "text") return <HistoryArtifactAwareText key={i} text={p.text} />;
        if (p.type === "reasoning") return <JarvisReasoningView key={i} text={p.text} />;
        if (p.type === "tool-call") {
          return <HistoryToolChip key={i} toolName={p.toolName} status={p.status} />;
        }
        return null;
      })}
    </div>
  );
}

/** Compact one-liner tool chip for history — subtle, spatial-glass aesthetic.
 *  Avoids the full JarvisToolCallView vibrant layout that dominated the UX. */
function HistoryToolChip({ toolName, status }: { toolName: string; status: string }) {
  const cleanName = toolName.replace(/^mcp__base44_tools__/, "").replace(/^mcp__/, "");
  const isError = status === "incomplete";
  const isRunning = status === "running";
  const Icon = isError ? XCircle : isRunning ? Loader2 : CheckCircle2;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono leading-none",
        isError
          ? "border-red-500/15 bg-red-500/[0.04] text-red-400/80"
          : isRunning
          ? "border-amber-500/15 bg-amber-500/[0.04] text-amber-400/80"
          : "border-white/[0.05] bg-white/[0.02] text-zinc-500"
      )}
    >
      <Icon className={cn("size-2.5", isRunning && "animate-spin")} />
      <span className="text-zinc-400">{cleanName}</span>
      <span className={cn(
        "text-[9px]",
        isError ? "text-red-400/60" : isRunning ? "text-amber-400/60" : "text-emerald-400/60"
      )}>
        {isRunning ? "running" : isError ? "failed" : "done"}
      </span>
    </span>
  );
}


/** HistoryArtifactAwareText — historical message text replay with artifact extraction.
 *  Parses [[ARTIFACT_START:type]] blocks from saved conversation history and renders
 *  them as proper artifact modules (DataTable / SlackCanvas / etc.) instead of raw text.
 *  Markdown rendering for the clean text portion preserves formatting. */
function HistoryArtifactAwareText({ text }: { text: string }) {
  const hasBlocks = text.includes("[[ARTIFACT_START:") && text.includes("[[ARTIFACT_END]]");
  if (!hasBlocks) {
    return (
      <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
        <HistoryMarkdown content={text} />
      </div>
    );
  }
  const { artifacts, cleanText } = parseArtifacts(text);
  return (
    <div>
      {cleanText.trim() && (
        <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
          <HistoryMarkdown content={cleanText} />
        </div>
      )}
      {artifacts.length > 0 && <ArtifactList artifacts={artifacts} />}
    </div>
  );
}

/** HistoryMarkdown — lightweight renderer for replayed message text.
 *  Uses the same MarkdownTextPrimitive as live messages for consistent UX. */
function HistoryMarkdown({ content }: { content: string }) {
  // Cast needed: react-markdown v10 + assistant-ui types omit children
  // for React 19 compat; in React 18 children is valid at runtime.
  const MD = MarkdownTextPrimitive as any;
  return (
    <MD
      remarkPlugins={[remarkGfm]}
      components={defaultComponents}
      className="aui-md text-sm leading-relaxed text-zinc-200"
    >{content}</MD>
  );
}
