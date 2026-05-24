"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Compass, Wrench, BarChart3, Target, ArrowRight, Loader2 } from "lucide-react";
import { GlassCard } from "../shared/GlassCard";
import { toast } from "sonner";

const chips = [
  { icon: Compass, label: "Plan a feature", prompt: "Help me plan a new feature for NewLeaf:" },
  { icon: Wrench, label: "Edit MCP", prompt: "I need to fire an MCP edit on the Base44 app:" },
  { icon: BarChart3, label: "Run a report", prompt: "Run a report on:" },
  { icon: Target, label: "Dispatch a crew", prompt: "Dispatch a parallel crew to:" },
];

const runtimes = [
  { value: "kimi-k2.6", label: "Kimi K2.6 (thinking)", desc: "Deep reasoning, default" },
  { value: "kimi-k2.6-fast", label: "Kimi K2.6 fast", desc: "Quick replies" },
  { value: "deepseek-v4", label: "DeepSeek V4", desc: "Council judge" },
  { value: "council", label: "Council (3 runtimes)", desc: "Parallel vote, premium" },
];

export function QuickStart() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [runtime, setRuntime] = useState("kimi-k2.6");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!goal.trim() || busy) return;
    setBusy(true);
    try {
      // For Phase 1: route to existing /api/agent and land on home with chat below
      // (Phase 2 will wire to /api/sessions and route to /chat/[id])
      sessionStorage.setItem("jarvis:pending", JSON.stringify({ goal, runtime }));
      toast.success("Starting session...");
      router.push("/chat");
    } catch (e) {
      toast.error("Failed to start session");
      setBusy(false);
    }
  }

  return (
    <GlassCard glow="aurora" className="p-6 md:p-8">
      <textarea
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
        placeholder="Plan, execute, audit, or just chat... Cmd+Enter to send."
        rows={4}
        className="w-full resize-none bg-transparent text-lg leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <motion.button
            key={c.label}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setGoal((prev) => prev ? prev : c.prompt + " ")}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
          >
            <c.icon className="size-3.5" />
            {c.label}
          </motion.button>
        ))}
      </div>
      <div className="mt-6 flex flex-col items-stretch gap-3 border-t border-white/[0.05] pt-4 md:flex-row md:items-center md:justify-between">
        <select
          value={runtime}
          onChange={(e) => setRuntime(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#12121b] px-3 py-2 text-sm text-zinc-300 outline-none focus:border-white/20"
        >
          {runtimes.map((r) => (<option key={r.value} value={r.value}>{r.label} — {r.desc}</option>))}
        </select>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={submit}
          disabled={!goal.trim() || busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all aurora-bg disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)]"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          {busy ? "Starting..." : "Start session"}
        </motion.button>
      </div>
    </GlassCard>
  );
}
