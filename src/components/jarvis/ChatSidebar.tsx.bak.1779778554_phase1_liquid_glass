"use client";
import React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { MessageSquarePlus, MessageSquare, Sparkles, X, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useConversationList } from "@/hooks/useConversationList";
import { formatRelativeTime, newConversationId, type Conversation } from "@/lib/jarvis-os-client";

const LS_CID = "jarvis-os:cid:v1";

export function ChatSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const activeId = (params?.id as string | undefined) || null;
  const { conversations, loading, error, refresh } = useConversationList();

  const handleNew = () => {
    const id = newConversationId();
    if (typeof window !== "undefined") sessionStorage.setItem(LS_CID, id);
    router.push(`/chat/${id}`);
    // Refresh after a tick so the new conversation shows up
    setTimeout(refresh, 1500);
  };

  const handleSelect = (id: string) => {
    if (typeof window !== "undefined") sessionStorage.setItem(LS_CID, id);
    router.push(`/chat/${id}`);
  };

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="relative z-20 flex w-72 flex-col border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-white/[0.04]">
            <Link href="/chat" className="flex items-center gap-2 group">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
                <Sparkles className="size-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight">Jarvis</span>
            </Link>
            <button onClick={() => onOpenChange(false)} className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors">
              <X className="size-4" />
            </button>
          </div>

          {/* New conversation */}
          <div className="p-3">
            <button
              onClick={handleNew}
              className="flex w-full items-center gap-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 px-3 py-2.5 text-sm font-medium hover:from-purple-500/30 hover:to-cyan-500/30 transition-all hover:border-white/20"
            >
              <MessageSquarePlus className="size-4" />
              New conversation
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-2 pt-1 pb-3">
            {loading && conversations.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-zinc-500">
                <Loader2 className="size-3.5 animate-spin" />
                Loading conversations…
              </div>
            )}
            {error && (
              <div className="mx-2 mb-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-300">
                Couldn’t load history. <button onClick={refresh} className="underline">Retry</button>
              </div>
            )}
            {!loading && conversations.length === 0 && !error && (
              <div className="py-8 text-center text-xs text-zinc-500">
                No conversations yet.<br/>Click <span className="text-zinc-300">New conversation</span> to start.
              </div>
            )}
            {conversations.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                active={c.id === activeId}
                onSelect={() => handleSelect(c.id)}
              />
            ))}
          </div>

          <div className="border-t border-white/[0.04] px-3 py-2.5 text-[10px] text-zinc-500 flex items-center justify-between">
            <span>Jarvis·OS·K2.6</span>
            <span className="text-zinc-600">{conversations.length} saved</span>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ConversationRow({ conversation, active, onSelect }: { conversation: Conversation; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`group relative w-full rounded-lg mb-0.5 transition-all flex items-center gap-2 px-2 py-1.5 text-left hover:bg-white/[0.04] ${active ? "bg-white/[0.06] ring-1 ring-white/10" : ""}`}
    >
      <MessageSquare className={`size-3.5 flex-shrink-0 ${active ? "text-cyan-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-zinc-200 truncate">
          {conversation.title || "New chat"}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span>{formatRelativeTime(conversation.updated_at)}</span>
          {conversation.last_seq > 0 && (
            <>
              <span className="text-zinc-700">·</span>
              <span>{conversation.last_seq} events</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
