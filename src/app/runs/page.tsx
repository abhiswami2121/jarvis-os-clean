import { Suspense } from "react";
import RunsClient from "./RunsClient";

export const metadata = {
  title: "Runs — Jarvis Command Center",
  description: "Make.com-style execution history viewer for all Jarvis VPS sessions",
};

export const dynamic = "force-dynamic";

interface VPSConversation {
  id: string;
  user_email: string;
  title: string;
  created_at: number;
  updated_at: number;
  last_seq: number;
  archived: number;
  tags: string;
}

interface RunsData {
  conversations: VPSConversation[];
  count: number;
}

async function getRunsData(): Promise<RunsData> {
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const res = await fetch(`${base}/api/runs?limit=100`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  } catch {
    return { conversations: [], count: 0 };
  }
}

export default async function RunsPage() {
  const data = await getRunsData();

  return (
    <div className="min-h-screen bg-[#08080f] flex flex-col">
      {/* Aurora glass header */}
      <div className="sticky top-0 z-40 border-b border-zinc-800/50 bg-zinc-900/40 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Runs</h1>
            <p className="text-sm text-zinc-400">
              Execution history — {data.count} sessions
            </p>
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
              href="/dashboard"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Dashboard
            </a>
          </div>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6">
        <Suspense fallback={<RunsSkeleton />}>
          <RunsClient initialData={data} />
        </Suspense>
      </main>
    </div>
  );
}

function RunsSkeleton() {
  return (
    <div className="flex gap-4 h-[calc(100vh-10rem)] animate-pulse">
      <div className="w-80 shrink-0 rounded-xl bg-zinc-900/40 border border-zinc-800/50" />
      <div className="flex-1 rounded-xl bg-zinc-900/40 border border-zinc-800/50" />
    </div>
  );
}
