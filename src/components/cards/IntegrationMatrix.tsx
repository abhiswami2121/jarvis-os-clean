"use client";
import React from "react";

type IntegrationStatus = "healthy" | "degraded" | "critical";

const statusStyles: Record<IntegrationStatus, { dot: string; bg: string; text: string; label: string }> = {
  healthy: { dot: "bg-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-300", label: "Healthy" },
  degraded: { dot: "bg-amber-400", bg: "bg-amber-500/10", text: "text-amber-300", label: "Degraded" },
  critical: { dot: "bg-red-400", bg: "bg-red-500/10", text: "text-red-300", label: "Critical" },
};

const integrations: { name: string; status: IntegrationStatus; detail: string; lastSync: string }[] = [
  { name: "NMI Gateway", status: "healthy", detail: "All vault + sub operations OK", lastSync: "2m ago" },
  { name: "VAPI", status: "degraded", detail: "Latency spike during historical branch replay", lastSync: "5m ago" },
  { name: "Freshcaller", status: "critical", detail: "API endpoint failing validation constraints", lastSync: "23m ago" },
  { name: "GHL", status: "healthy", detail: "SMS + email pipelines flowing", lastSync: "1m ago" },
  { name: "Slack", status: "healthy", detail: "Canvas + thread sync active", lastSync: "now" },
];

export const IntegrationMatrix: React.FC = () => (
  <div className="space-y-2">
    {integrations.map((i) => {
      const s = statusStyles[i.status];
      return (
        <div key={i.name} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent backdrop-blur-xl p-4 transition-all hover:border-white/20">
          <div className="relative">
            <span className={"block w-2.5 h-2.5 rounded-full " + s.dot} />
            {i.status !== "healthy" && <span className={"absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping " + s.dot + " opacity-50"} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-zinc-100">{i.name}</h4>
              <span className={"text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded " + s.bg + " " + s.text}>{s.label}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">{i.detail}</p>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 shrink-0">{i.lastSync}</span>
        </div>
      );
    })}
  </div>
);
