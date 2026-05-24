"use client";
import { motion } from "motion/react";
import { StatusPill } from "../shared/StatusPill";
import { cn } from "@/lib/utils";

export interface RuntimeData {
  id: string;
  name: string;
  provider: string;
  status: "ready" | "active" | "degraded" | "down";
  latencyMs: number;
  callsToday: number;
  costToday: number;
  description: string;
  accent: "blue" | "purple" | "emerald" | "amber";
}

const accentGrad: Record<RuntimeData["accent"], string> = {
  blue: "from-blue-500/30 via-blue-500/10 to-transparent",
  purple: "from-purple-500/30 via-purple-500/10 to-transparent",
  emerald: "from-emerald-500/30 via-emerald-500/10 to-transparent",
  amber: "from-amber-500/30 via-amber-500/10 to-transparent",
};

const statusVariant: Record<RuntimeData["status"], "emerald" | "amber" | "rose" | "neutral"> = {
  ready: "emerald",
  active: "emerald",
  degraded: "amber",
  down: "rose",
};

export function RuntimeCard({ runtime }: { runtime: RuntimeData }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121b]/80 p-5 backdrop-blur-xl"
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60", accentGrad[runtime.accent])} />
      <div className="relative z-10">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-zinc-500">{runtime.provider}</div>
            <div className="mt-0.5 text-base font-semibold text-white">{runtime.name}</div>
          </div>
          <StatusPill variant={statusVariant[runtime.status]} pulse={runtime.status === "active"}>{runtime.status}</StatusPill>
        </div>
        <p className="text-xs text-zinc-400">{runtime.description}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-3 text-center">
          <div>
            <div className="text-base font-semibold text-white">{runtime.latencyMs}<span className="text-xs text-zinc-500">ms</span></div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">latency</div>
          </div>
          <div>
            <div className="text-base font-semibold text-white">{runtime.callsToday}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">calls today</div>
          </div>
          <div>
            <div className="text-base font-semibold text-white">${runtime.costToday.toFixed(2)}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">cost today</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
