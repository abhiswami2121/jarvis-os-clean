"use client";
import React from "react";
import { motion } from "motion/react";
import { Sparkles, Zap, Database, MessageSquare, Wrench } from "lucide-react";

const QUICK_PROMPTS = [
  { icon: Database, label: "Show today’s billing pulse", prompt: "Run /billing-sync and show me today’s decline + recovery numbers" },
  { icon: MessageSquare, label: "Brief me on overnight", prompt: "Pull rolling context, give me a fast morning brief" },
  { icon: Wrench, label: "Run dispute orchestrator", prompt: "Show queue status for credit restoration" },
  { icon: Zap, label: "Lead flow snapshot", prompt: "Pull lead flow + transfer rates for the last 24h" },
];

export function ChatGreeting({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center mb-10"
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow-2xl shadow-purple-500/30 mb-5">
          <Sparkles className="size-6 text-white" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent mb-2">
          What can I run for you?
        </h1>
        <p className="text-sm text-zinc-500 max-w-md">
          NewLeaf operations agent. K2.6 brain, VPS-persistent memory, full tool access.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {QUICK_PROMPTS.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.button
              key={p.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              onClick={() => onSelect(p.prompt)}
              className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] px-4 py-3 text-left transition-all"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/[0.06] group-hover:border-white/[0.12] flex-shrink-0">
                <Icon className="size-3.5 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                  {p.label}
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                  {p.prompt}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-zinc-600">
        <span className="size-1 rounded-full bg-emerald-500" />
        <span>K2.6 · VPS persistence · every conversation auto-saves</span>
      </div>
    </div>
  );
}
