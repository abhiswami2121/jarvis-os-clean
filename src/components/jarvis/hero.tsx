"use client";

import { TrendingUp, AlertCircle, Phone, Sparkles } from "lucide-react";
import { useThreadRuntime } from "@assistant-ui/react";

const SUGGESTIONS = [
  { icon: TrendingUp, label: "Morning pulse", prompt: "What is the most important thing I should know about right now? Notifications, billing, stale leads, system health.", color: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-500" },
  { icon: AlertCircle, label: "At-risk billing", prompt: "Show me the top 10 at-risk customers with declining payments and recommended actions.", color: "from-red-500/20 to-orange-500/20", iconColor: "text-red-500" },
  { icon: Phone, label: "Stale leads", prompt: "Pull all VAPI leads that transferred but never enrolled in the last 7 days.", color: "from-purple-500/20 to-pink-500/20", iconColor: "text-purple-500" },
  { icon: Sparkles, label: "System health", prompt: "Run sync_health check on all integrations and report any stale syncs.", color: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-500" },
];

export function Hero() {
  const threadRuntime = useThreadRuntime();
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gemini-mesh">
      <div className="max-w-3xl w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6 border border-primary/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Kimi K2.6 · unlimited turns · VPS brain connected
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent">
          Ready when you are.
        </h1>
        <p className="text-lg text-muted-foreground mt-3 max-w-xl mx-auto">
          Operational intelligence, code, artifacts, workflows. What should we get done?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 max-w-2xl mx-auto">
          {SUGGESTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.label} onClick={() => { threadRuntime.append({ role: "user", content: [{ type: "text", text: s.prompt }] }); }}
                className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${s.color} p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg hover:border-primary/30`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center shadow-sm shrink-0">
                    <Icon className={`w-5 h-5 ${s.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{s.label}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{s.prompt.slice(0, 60)}...</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
