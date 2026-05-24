"use client";
import { motion } from "motion/react";
import { Activity, Sparkles } from "lucide-react";

export function ActiveSessionsGrid() {
  // Phase 1: empty state. Phase 2 wires this to /api/sessions live polling.
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Activity className="size-4 text-zinc-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Active Sessions</h2>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">0</span>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl border border-dashed border-white/[0.08] bg-[#12121b]/40 p-10 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20"
        >
          <Sparkles className="size-5 text-white/70" />
        </motion.div>
        <h3 className="text-base font-medium text-zinc-300">No active sessions yet</h3>
        <p className="mt-1 text-sm text-zinc-500">Start one above. Sessions will appear here, live with status.</p>
      </motion.div>
    </section>
  );
}
