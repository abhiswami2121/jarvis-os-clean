"use client";

import { useState, useEffect, useCallback } from "react";
import { RunListItem, RunItem } from "@/components/runs/RunListItem";
import { RunDetailPane } from "@/components/runs/RunDetailPane";

interface VPSConversation {
  id: string;
  user_email: string;
  title: string;
  created_at: number;
  updated_at: number;
  last_seq: number;
  archived: number;
}

interface RunsData {
  conversations: VPSConversation[];
  count: number;
}

interface ReplayData {
  conversation: VPSConversation;
  replay: { events: Array<{ seq: number; event_type: string; data: string | Record<string, unknown>; timestamp: number }> };
}

export default function RunsClient({ initialData }: { initialData: RunsData }) {
  const [conversations] = useState<VPSConversation[]>(initialData.conversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<ReplayData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDetail = useCallback(async (cid: string) => {
    setLoading(true);
    setDetailData(null);
    try {
      const res = await fetch(`/api/runs?cid=${cid}`);
      if (res.ok) {
        setDetailData(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    }
  }, [selectedId, loadDetail]);

  const selected = conversations.find((c) => c.id === selectedId) || null;

  return (
    <div className="flex gap-4 h-[calc(100vh-10rem)]">
      {/* Left column: session list */}
      <div className="w-80 shrink-0 rounded-xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm flex flex-col">
        <div className="px-3 py-2.5 border-b border-zinc-800/50 shrink-0">
          <input
            type="text"
            placeholder="Filter sessions..."
            className="w-full bg-zinc-900/60 border border-zinc-700/40 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600/60"
            onChange={(e) => {
              // Simple client-side filter
              const q = e.target.value.toLowerCase();
              const items = document.querySelectorAll<HTMLElement>("[data-run-item]");
              items.forEach((el) => {
                const title = el.dataset.title?.toLowerCase() || "";
                el.style.display = title.includes(q) ? "" : "none";
              });
            }}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {conversations.map((conv) => (
            <div key={conv.id} data-run-item data-title={conv.title}>
              <RunListItem
                item={conv}
                selected={selectedId === conv.id}
                onClick={() => setSelectedId(conv.id)}
              />
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-center text-zinc-500 text-sm py-8">
              No sessions found
            </div>
          )}
        </div>
        <div className="px-3 py-2 border-t border-zinc-800/50 shrink-0">
          <p className="text-[10px] text-zinc-600">
            {conversations.length} sessions · click to inspect
          </p>
        </div>
      </div>

      {/* Right column: detail pane */}
      <div className="flex-1 rounded-xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm overflow-hidden flex flex-col">
        <RunDetailPane
          conversation={selected}
          replay={detailData?.replay || null}
          loading={loading}
        />
      </div>
    </div>
  );
}
