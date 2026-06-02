"use client";

import { RunDetailPane } from "@/components/runs/RunDetailPane";

interface RunDetailViewProps {
  conversation: {
    id: string;
    user_email: string;
    title: string;
    created_at: number;
    updated_at: number;
    last_seq: number;
  };
  replay: {
    events: Array<{
      seq: number;
      event_type: string;
      data: string | Record<string, unknown>;
      timestamp: number;
    }>;
  } | null;
  goldenMd: string | null;
}

function GoldenAnalysis({ markdown }: { markdown: string }) {
  // Render the 5-dimension analysis section
  const sections = markdown.split("---");
  const analysisSection = sections.slice(2).join("---"); // Skip header block

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-emerald-500/10 bg-emerald-500/[0.03]">
        <span className="text-xs font-semibold text-emerald-400">
          🔬 5-Dimension Analysis
        </span>
      </div>
      <div className="p-4 text-xs text-zinc-300 leading-relaxed max-h-[600px] overflow-y-auto">
        <pre className="whitespace-pre-wrap font-mono text-[11px] text-zinc-400">
          {analysisSection.slice(0, 8000)}
        </pre>
      </div>
    </div>
  );
}

export default function RunDetailView({
  conversation,
  replay,
  goldenMd,
}: RunDetailViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Event replay */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm overflow-hidden flex-1 min-h-[400px]">
        <RunDetailPane
          conversation={conversation}
          replay={replay}
          loading={false}
        />
      </div>

      {/* Golden analysis if available */}
      {goldenMd && <GoldenAnalysis markdown={goldenMd} />}

      {/* No golden analysis */}
      {!goldenMd && (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-4 text-center">
          <p className="text-xs text-zinc-500">
            No 5-dimension analysis available for this run.
            <br />
            Run the bulk mapper to generate it.
          </p>
        </div>
      )}
    </div>
  );
}
