import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard — Jarvis Command Center",
  description: "Real-time NewLeaf operations dashboard",
};

export const dynamic = "force-dynamic";

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

async function getDashboardData(): Promise<DashboardData> {
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const res = await fetch(`${base}/api/dashboard`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  } catch {
    return {
      enrollment_today: 0,
      payments_today: 0,
      at_risk_mrr: 0,
      calls_today: 0,
      vapi_today: 0,
      tickets_open: 0,
      recovery_open: 0,
      vps_sessions: 0,
      mvp_count: 0,
      golden_run_count: 0,
      cached: false,
      ts: Date.now(),
    };
  }
}

export default async function DashboardPage() {
  const initialData = await getDashboardData();

  return (
    <div className="min-h-screen bg-[#08080f]">
      {/* Aurora glass header */}
      <div className="sticky top-0 z-40 border-b border-zinc-800/50 bg-zinc-900/40 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Dashboard</h1>
            <p className="text-sm text-zinc-400">NewLeaf operations at a glance</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/chat"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Chat
            </a>
            <span className="text-zinc-700">|</span>
            <a
              href="/"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Home
            </a>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardClient initialData={initialData} />
        </Suspense>
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="h-32 rounded-xl bg-zinc-900/40 border border-zinc-800/50"
        />
      ))}
    </div>
  );
}
