"use client";
import React from "react";
import type { ArtifactPayload } from "@/lib/stores/artifact-store";

function Metric({ label, value, accent }: { label: string; value: string | number; accent?: "emerald" | "fuchsia" | "amber" | "sky" | "red" }) {
  const accentMap = { emerald: "text-emerald-300", fuchsia: "text-fuchsia-300", amber: "text-amber-300", sky: "text-sky-300", red: "text-red-300" };
  const cls = accent ? accentMap[accent] : "text-zinc-100";
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-[12px] text-zinc-400">{label}</span>
      <span className={"font-mono text-sm font-semibold tabular-nums " + cls}>{value}</span>
    </div>
  );
}

export const AnalyticsCard: React.FC<{ payload: ArtifactPayload | null }> = ({ payload }) => {
  const data = payload?.reportData || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent backdrop-blur-xl p-4">
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-3">Pipeline & Volume</h4>
          <Metric label="Active Customers" value={data.totalCustomers ?? "2,000"} accent="sky" />
          <Metric label="Submitted Clients" value={data.submittedClients ?? "335"} />
          <Metric label="Enrolled (Active)" value={data.enrolledActive ?? "185"} accent="emerald" />
          <Metric label="Enrolled (Pending)" value={data.enrolledPending ?? "101"} accent="amber" />
          <Metric label="New This Week" value={data.newThisWeek ?? "24"} accent="fuchsia" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent backdrop-blur-xl p-4">
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-3">Billing Breakdown</h4>
          <Metric label="Confirmed Subs" value={data.confirmedSubs ?? "158"} accent="emerald" />
          <Metric label="Successful Payments" value={data.successfulPayments ?? "16"} accent="emerald" />
          <Metric label="Soft Declines" value={data.softDeclines ?? "5"} accent="amber" />
          <Metric label="Hard Declines" value={data.hardDeclines ?? "2"} accent="red" />
          <Metric label="Paused Subscriptions" value={data.pausedSubs ?? "19"} />
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.02] backdrop-blur-xl p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/80">Monthly Recurring Revenue</p>
            <h2 className="font-mono text-3xl font-bold text-emerald-300 tabular-nums mt-1">${(data.mrr ?? 37297.32).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500">vs baseline</p>
            <p className="text-xs text-emerald-400 font-mono">+ on track</p>
          </div>
        </div>
      </div>
    </div>
  );
};
