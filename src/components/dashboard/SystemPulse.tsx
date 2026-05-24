"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface Pulse {
  vps: "up" | "down" | "degraded";
  tunnel: "up" | "down" | "degraded";
  base44: "up" | "down" | "degraded";
  vercel: "up" | "down" | "degraded";
  sessionsToday: number;
  avgLatencyMs: number;
  costToday: number;
  tunnelUptime: string;
}

const dotColor = (s: string) => s === "up" ? "bg-emerald-400" : s === "degraded" ? "bg-amber-400" : "bg-rose-400";

export function SystemPulse() {
  const [pulse, setPulse] = useState<Pulse | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await fetch("/api/system/pulse", { cache: "no-store" });
        const d = await r.json();
        if (mounted) setPulse(d);
      } catch {}
    };
    load();
    const t = setInterval(load, 30_000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  if (!pulse) return null;

  return (
    <footer className="sticky bottom-0 z-40 border-t border-white/[0.05] bg-[#08080f]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-6 text-xs">
        <div className="flex items-center gap-4">
          {(["vps", "tunnel", "base44", "vercel"] as const).map((k) => (
            <div key={k} className="flex items-center gap-1.5">
              <motion.span
                animate={pulse[k] === "up" ? { opacity: [0.7, 1, 0.7] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={"size-1.5 rounded-full " + dotColor(pulse[k])}
              />
              <span className="uppercase tracking-wider text-zinc-500">{k}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-5 text-zinc-400">
          <span><span className="text-zinc-200">{pulse.sessionsToday}</span> sessions</span>
          <span><span className="text-zinc-200">{pulse.avgLatencyMs}ms</span> avg</span>
          <span><span className="text-zinc-200">${pulse.costToday.toFixed(2)}</span> today</span>
          <span><span className="text-zinc-200">{pulse.tunnelUptime}</span> uptime</span>
        </div>
      </div>
    </footer>
  );
}
