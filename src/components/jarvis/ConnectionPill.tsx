"use client";
import React from "react";
import { motion } from "motion/react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

export type ConnectionState = "connected" | "streaming" | "reconnecting" | "offline";

export function ConnectionPill({ state, latency }: { state: ConnectionState; latency?: number }) {
  const config = {
    connected: { color: "bg-emerald-500", glow: "shadow-emerald-500/50", label: "Connected", icon: Wifi, pulse: false },
    streaming: { color: "bg-cyan-400", glow: "shadow-cyan-400/60", label: "Streaming", icon: Wifi, pulse: true },
    reconnecting: { color: "bg-amber-500", glow: "shadow-amber-500/50", label: "Reconnecting", icon: Loader2, pulse: false },
    offline: { color: "bg-red-500", glow: "shadow-red-500/60", label: "Offline", icon: WifiOff, pulse: false },
  }[state];

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-zinc-300 backdrop-blur-sm"
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.color} opacity-75`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${config.color} shadow-md ${config.glow}`} />
      </span>
      <span className="tracking-tight">{config.label}</span>
      {typeof latency === "number" && state === "connected" && (
        <span className="text-zinc-500">· {latency}ms</span>
      )}
      {state === "reconnecting" && <Icon className="size-3 animate-spin text-amber-400" />}
    </motion.div>
  );
}
