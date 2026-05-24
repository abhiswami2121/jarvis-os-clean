"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Sparkles, AlertCircle, Plus, MessageSquare, Square } from "lucide-react";
import { CHAT_API, type ChatMessage, type Conversation } from "@/lib/jarvis-transport";
import { cn } from "@/lib/utils";

const LS_KEY = "jarvis_conversations_v2";

function uid() { return Math.random().toString(36).slice(2, 10); }

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveConversations(convs: Conversation[]) {
  if (typeof window !== "undefined") localStorage.setItem(LS_KEY, JSON.stringify(convs));
}

export function JarvisChatPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const loaded = loadConversations();
    setConversations(loaded);
    if (loaded.length > 0) setActiveId(loaded[0].id);
    else newConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { saveConversations(conversations); }, [conversations]);
  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [conversations, activeId]);

  const activeConv = conversations.find(c => c.id === activeId) || null;

  function newConversation() {
    if (sending) abortRef.current?.abort();
    const conv: Conversation = { id: uid(), title: "New chat", messages: [], createdAt: Date.now() };
    setConversations(prev => [conv, ...prev]);
    setActiveId(conv.id);
    setError(null);
  }

  function selectConversation(id: string) {
    if (sending) abortRef.current?.abort();
    setActiveId(id);
    setError(null);
  }

  function deleteConversation(id: string) {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      if (activeId === id) setActiveId(next[0]?.id || null);
      return next;
    });
  }

  function updateActiveMessages(updater: (msgs: ChatMessage[]) => ChatMessage[]) {
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages: updater(c.messages) } : c));
  }

  function updateActiveTitle(title: string) {
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, title } : c));
  }

  function stopStreaming() {
    abortRef.current?.abort();
    abortRef.current = null;
    setSending(false);
    updateActiveMessages(msgs => msgs.map(m => m.status === "streaming" ? { ...m, status: "complete" } : m));
  }

  async function sendMessage() {
    if (!input.trim() || sending || !activeConv) return;
    setError(null);
    setSending(true);
    const userText = input.trim();
    setInput("");

    const userMsg: ChatMessage = { id: uid(), role: "user", text: userText, status: "complete" };
    const assistantMsg: ChatMessage = { id: uid(), role: "assistant", text: "", status: "streaming" };
    const isFirstMessage = activeConv.messages.length === 0;
    updateActiveMessages(msgs => [...msgs, userMsg, assistantMsg]);
    if (isFirstMessage) updateActiveTitle(userText.slice(0, 40));

    abortRef.current = new AbortController();
    try {
      const allMessages = [...activeConv.messages, userMsg].map(m => ({ role: m.role, content: m.text }));
      const response = await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
        signal: abortRef.current.signal,
      });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";
        for (const block of blocks) {
          let event = "message";
          let data = "";
          for (const line of block.split("\n")) {
            if (line.startsWith("event: ")) event = line.slice(7);
            else if (line.startsWith("data: ")) data = line.slice(6);
          }
          if (!data) continue;
          try {
            const payload = JSON.parse(data);
            if (event === "text" && payload.text) {
              const chunk = payload.text;
              updateActiveMessages(msgs => msgs.map(m =>
                m.id === assistantMsg.id ? { ...m, text: m.text + chunk } : m
              ));
            } else if (event === "error") {
              setError(payload.error || "Stream error");
              updateActiveMessages(msgs => msgs.map(m =>
                m.id === assistantMsg.id ? { ...m, status: "error" } : m
              ));
            } else if (event === "done" || event === "turn_complete") {
              updateActiveMessages(msgs => msgs.map(m =>
                m.id === assistantMsg.id ? { ...m, status: "complete" } : m
              ));
            }
          } catch {}
        }
      }
      updateActiveMessages(msgs => msgs.map(m =>
        m.id === assistantMsg.id && m.status === "streaming" ? { ...m, status: "complete" } : m
      ));
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setError(e.message || "Network error");
        updateActiveMessages(msgs => msgs.map(m =>
          m.id === assistantMsg.id ? { ...m, status: "error" } : m
        ));
      }
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="flex h-full bg-[#0a0a0f] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col bg-[#0f0f17]">
        <button onClick={newConversation} className="m-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium transition">
          <Plus className="w-4 h-4" /> New chat
        </button>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {conversations.map(c => (
            <div key={c.id} className={cn("group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition",
              c.id === activeId ? "bg-emerald-500/15 text-emerald-200" : "hover:bg-white/5 text-white/70")}
              onClick={() => selectConversation(c.id)}>
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">{c.title}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 text-xs px-1">×</button>
            </div>
          ))}
        </div>
        <div className="p-3 text-xs text-white/30 border-t border-white/5">Jarvis-OS · K2.6</div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        <header className="px-6 py-3 border-b border-white/10 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="font-medium">{activeConv?.title || "Jarvis"}</span>
          <span className="ml-auto text-xs text-white/40">{sending ? "streaming…" : "ready"}</span>
        </header>

        <div ref={messagesRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {activeConv?.messages.length === 0 && (
            <div className="text-center text-white/30 mt-20 text-sm">Start a conversation with Jarvis</div>
          )}
          {activeConv?.messages.map(msg => (
            <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-2xl px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === "user" ? "bg-emerald-500/15 text-emerald-100 border border-emerald-500/20" : "bg-white/5 text-white/90 border border-white/10")}>
                {msg.text || (msg.status === "streaming" && <span className="text-white/40">thinking…</span>)}
                {msg.status === "streaming" && msg.text && <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-emerald-400 align-middle" />}
                {msg.status === "error" && <span className="ml-2 text-red-400 text-xs">(error)</span>}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mx-6 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="p-4 border-t border-white/10">
          <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl p-2">
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Message Jarvis…" rows={1}
              className="flex-1 bg-transparent outline-none resize-none px-2 py-2 text-sm text-white placeholder-white/30 max-h-40"
              disabled={!activeConv} />
            {sending ? (
              <button onClick={stopStreaming} className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 transition" title="Stop">
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={sendMessage} disabled={!input.trim() || !activeConv}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/5 disabled:text-white/30 text-black transition">
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
