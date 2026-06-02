"use client";

import { useState, useEffect, useCallback } from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import SessionsCard from "@/components/dashboard/SessionsCard";

interface DashboardData {
  enrollment_today: number;
  payments_today: number;
  at_risk_mrr: number;
  calls_today: number;
  vapi_today: number;
  tickets_open: number;
  recovery_open: number;
  vps_sessions: number;
  mvp_count: number;
  golden_run_count: number;
  cached?: boolean;
  ts: number;
}

export default function DashboardClient({
  initialData,
}: {
  initialData: DashboardData;
}) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const fresh = await res.json();
        setData(fresh);
        setLastRefresh(Date.now());
      }
    } catch {
      // keep stale data
    }
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const ageMs = Date.now() - lastRefresh;
  const ageText =
    ageMs < 5000 ? "just now" : `${Math.round(ageMs / 1000)}s ago`;

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          {data.cached ? "Cached" : "Live"} • Refreshed {ageText}
        </span>
        <button
          onClick={refresh}
          className="px-3 py-1 rounded-md bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors text-zinc-400"
        >
          Refresh
        </button>
      </div>

      {/* Metric grid — 3 columns desktop, 2 tablet, 1 mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Enrollments Today"
          value={data.enrollment_today}
          trend={data.enrollment_today > 0 ? "up" : "flat"}
          icon="📋"
        />
        <MetricCard
          label="Payments Today"
          value={data.payments_today}
          trend={data.payments_today > 0 ? "up" : "flat"}
          icon="💳"
          format="currency"
        />
        <MetricCard
          label="At-Risk MRR"
          value={data.at_risk_mrr}
          trend={data.at_risk_mrr > 0 ? "down" : "flat"}
          icon="⚠️"
          variant="warning"
        />
        <MetricCard
          label="Calls Today"
          value={data.calls_today}
          trend="flat"
          icon="📞"
        />
        <MetricCard
          label="VAPI Today"
          value={data.vapi_today}
          trend="flat"
          icon="🤖"
        />
        <MetricCard
          label="Open Tickets"
          value={data.tickets_open}
          trend={data.tickets_open > 5 ? "down" : "flat"}
          icon="🎫"
          variant={data.tickets_open > 10 ? "danger" : "default"}
        />
        <MetricCard
          label="Recovery Open"
          value={data.recovery_open}
          trend="flat"
          icon="🔄"
        />
        <MetricCard
          label="VPS Sessions"
          value={data.vps_sessions}
          trend="flat"
          icon="🖥️"
        />
        <MetricCard
          label="MVP Count"
          value={data.mvp_count}
          trend="flat"
          icon="🚀"
        />
      </div>

      {/* Sessions sparkline card */}
      <SessionsCard
        vpsSessions={data.vps_sessions}
        mvpCount={data.mvp_count}
        goldenRunCount={data.golden_run_count}
      />
    </div>
  );
}
