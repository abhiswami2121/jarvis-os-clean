import { Suspense } from "react";
import { notFound } from "next/navigation";
import RunDetailView from "./RunDetailView";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  return {
    title: `Run ${sid} — Jarvis`,
    description: `Session ${sid} execution details`,
  };
}

async function getSessionData(sid: string) {
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const [detailRes, goldenRes] = await Promise.all([
      fetch(`${base}/api/runs?cid=${sid}`, {
        next: { revalidate: 60 },
      }),
      fetch(`${base}/api/runs?golden=${sid}`, {
        next: { revalidate: 60 },
      }),
    ]);

    let conversation = null;
    let replay = null;
    let goldenMd: string | null = null;

    if (detailRes.ok) {
      const detail = await detailRes.json();
      conversation = detail.conversation;
      replay = detail.replay;
    }

    if (goldenRes.ok) {
      goldenMd = await goldenRes.text();
    }

    return { conversation, replay, goldenMd };
  } catch {
    return { conversation: null, replay: null, goldenMd: null };
  }
}

export default async function RunDetailPage({ params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const data = await getSessionData(sid);

  if (!data.conversation) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#08080f] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-zinc-800/50 bg-zinc-900/40 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">
              Run {sid.slice(0, 12)}
            </h1>
            <p className="text-sm text-zinc-400">
              {data.conversation.title?.slice(0, 100) || "Untitled"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/runs"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              All Runs
            </a>
            <span className="text-zinc-700">|</span>
            <a
              href="/chat"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Chat
            </a>
          </div>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6">
        <Suspense fallback={<div className="animate-pulse h-96 bg-zinc-900/40 rounded-xl" />}>
          <RunDetailView
            conversation={data.conversation}
            replay={data.replay}
            goldenMd={data.goldenMd}
          />
        </Suspense>
      </main>
    </div>
  );
}
