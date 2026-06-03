"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

interface PlatformHealth {
  name: string;
  key: string;
  status: "connected" | "disconnected" | "error" | "unknown";
  latencyMs?: number;
  error?: string;
  endpoint?: string;
  category: "crm" | "payments" | "project_mgmt" | "automation" | "ai" | "comms";
}

interface HealthResponse {
  overall: "healthy" | "degraded" | "offline";
  connectedCount: number;
  total: number;
  platforms: PlatformHealth[];
  checkedAt: string;
}

// ── Status styling ─────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  connected: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]",
  disconnected: "bg-zinc-600",
  error: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]",
  unknown: "bg-zinc-500 animate-pulse",
};

const CATEGORY_LABELS: Record<string, string> = {
  crm: "CRM",
  payments: "Payments",
  project_mgmt: "Issues",
  automation: "Automation",
  ai: "AI",
  comms: "Comms",
};

const CATEGORY_ICONS: Record<string, string> = {
  crm: "🏢",
  payments: "💳",
  project_mgmt: "📋",
  automation: "⚡",
  ai: "🧠",
  comms: "💬",
};

// ── Component ─────────────────────────────────────────────────────

export function PlatformHealthPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch("/api/platforms/health");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    // Auto-refresh every 60s
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-zinc-500" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Platform Health
          </h3>
        </div>
        <button
          onClick={fetchHealth}
          disabled={refreshing}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
          aria-label="Refresh health"
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Overall status */}
      {health && !loading && (
        <div className="px-4 py-2.5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "size-2 rounded-full",
                health.overall === "healthy"
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : health.overall === "degraded"
                  ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              )}
            />
            <span className="text-[11px] font-medium text-zinc-300 capitalize">
              {health.overall}
            </span>
            <span className="text-[10px] text-zinc-600">
              {health.connectedCount}/{health.total} online
            </span>
          </div>
        </div>
      )}

      {/* Platform list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-2 rounded-full bg-emerald-400/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
            <AlertTriangle className="size-5 text-amber-400/60" />
            <p className="text-xs text-zinc-500">{error}</p>
            <button
              onClick={fetchHealth}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {health?.platforms.map((platform) => (
          <div
            key={platform.key}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group"
          >
            {/* Status dot */}
            <div className="relative flex-shrink-0">
              <div className={cn("size-2 rounded-full", STATUS_STYLES[platform.status])} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">{CATEGORY_ICONS[platform.category] || "🔌"}</span>
                <span className="text-[11px] font-medium text-zinc-300 truncate">
                  {platform.name}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-zinc-600">
                  {CATEGORY_LABELS[platform.category] || platform.category}
                </span>
                {platform.latencyMs != null && platform.status === "connected" && (
                  <span className="text-[9px] text-emerald-500/70 font-mono">
                    {platform.latencyMs}ms
                  </span>
                )}
                {platform.error && (
                  <span className="text-[9px] text-red-400/70 truncate max-w-[100px]">
                    {platform.error}
                  </span>
                )}
              </div>
            </div>

            {/* Status label */}
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider flex-shrink-0",
                platform.status === "connected"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : platform.status === "error"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-zinc-500/10 text-zinc-500"
              )}
            >
              {platform.status === "connected" ? (
                <Wifi className="size-2.5" />
              ) : platform.status === "error" ? (
                <AlertTriangle className="size-2.5" />
              ) : (
                <WifiOff className="size-2.5" />
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      {health && (
        <div className="px-4 py-2 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-[9px] text-zinc-600 flex items-center gap-1">
            <Clock className="size-2.5" />
            {new Date(health.checkedAt).toLocaleTimeString()}
          </span>
          <a
            href="/connectors"
            className="text-[9px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
          >
            Manage <ExternalLink className="size-2.5" />
          </a>
        </div>
      )}
    </div>
  );
}

export default PlatformHealthPanel;
