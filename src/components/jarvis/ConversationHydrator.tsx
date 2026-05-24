"use client";
import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import { useConversationReplay, type HydratedMessage, type MessagePart } from "@/hooks/useConversationReplay";
import { JarvisReasoningView, JarvisToolCallView } from "@/components/jarvis/JarvisMessageRenderer";
import { toast } from "sonner";

/**
 * Shows replayed conversation history in a clean, read-only timeline.
 * Sits ABOVE the live <Thread> when a conversation has prior history.
 * Disappears once user sends a new message (handled by parent visibility).
 *
 * Phase B2 — Now renders tool calls, reasoning, and text parts with the
 * same JarvisMessageRenderer components used in the live thread.
 */
export function ConversationHydrator({ cid }: { cid: string | null }) {
  const { messages, loading, error, isResuming } = useConversationReplay(cid);

  useEffect(() => {
    if (isResuming) {
      toast.loading("Resuming conversation…", { id: "resume-toast", duration: 60000 });
    } else {
      toast.dismiss("resume-toast");
    }
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
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
        <span>Previous conversation · {messages.length} messages</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
      </div>
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
    </div>
  );
}

function MessageBubble({ message, index }: { message: HydratedMessage; index: number }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.25 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isUser
          ? "bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 text-zinc-100"
          : "bg-white/[0.03] border border-white/[0.06] text-zinc-200"
      }`}>
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
            <Sparkles className="size-2.5" />
            Jarvis
          </div>
        )}
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
    <div className="space-y-1">
      {parts.map((part, i) => {
        switch (part.type) {
          case "text":
            return (
              <div key={i} className="whitespace-pre-wrap">
                {part.text}
              </div>
            );
          case "reasoning":
            return <JarvisReasoningView key={i} text={part.text} />;
          case "tool-call":
            return (
              <JarvisToolCallView
                key={i}
                toolName={part.toolName}
                args={part.args}
                argsText={JSON.stringify(part.args, null, 2)}
                result={part.result}
                status={{ type: part.status }}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
