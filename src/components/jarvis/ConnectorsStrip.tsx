"use client";
import { Database, Phone, MessageSquare, CreditCard, FileSearch, Webhook } from "lucide-react";

const CONNECTORS = [
  { id: "base44", label: "Base44", icon: Database, status: "healthy", lastSync: "now" },
  { id: "nmi", label: "NMI", icon: CreditCard, status: "healthy", lastSync: "2m" },
  { id: "vapi", label: "VAPI", icon: Phone, status: "healthy", lastSync: "now" },
  { id: "ghl", label: "GHL", icon: MessageSquare, status: "degraded", lastSync: "42m" },
  { id: "slack", label: "Slack", icon: Webhook, status: "healthy", lastSync: "now" },
  { id: "freshcaller", label: "Freshcaller", icon: FileSearch, status: "healthy", lastSync: "5m" },
];

const statusColors: any = {
  healthy: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  degraded: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  down: "bg-rose-500/10 border-rose-500/20 text-rose-400",
};

export function ConnectorsStrip() {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-b border-white/[0.04] bg-white/[0.01]">
      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mr-2 shrink-0">Live</span>
      {CONNECTORS.map(c => {
        const Icon = c.icon;
        return (
          <button key={c.id} className={`shrink-0 flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${statusColors[c.status]}`}>
            <Icon className="size-3" />
            <span>{c.label}</span>
            <span className="opacity-60">· {c.lastSync}</span>
          </button>
        );
      })}
    </div>
  );
}
