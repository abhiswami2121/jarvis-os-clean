"use client";

import { Clock, Activity, Hash } from "lucide-react";

export interface RunItem {
  id: string;
  user_email: string;
  title: string;
  created_at: number;
  updated_at: number;
  last_seq: number;
  archived: number;
}

function statusPill(item: RunItem) {
  if (item.archived) return { label: "Archived", cls: "bg-zinc-800/50 text-zinc-500 border-zinc-700/30" };
  if (item.last_seq > 50) return { label: "Active", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
  if (item.last_seq > 0) return { label: "Idle", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  return { label: "Empty", cls: "bg-zinc-800/50 text-zinc-600 border-zinc-700/30" };
}

function relativeTime(ts: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - ts;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function goalPreview(title: string, maxLen = 80): string {
  const cleaned = title
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen) + "…";
}

export function RunListItem({
  item,
  selected,
  onClick,
}: {
  item: RunItem;
  selected: boolean;
  onClick: () => void;
}) {
  const pill = statusPill(item);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-150 ${
        selected
          ? "bg-white/[0.06] border-white/[0.12] shadow-[0_0_15px_rgb(255_255_255_/_0.02)]"
          : "border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-200 truncate leading-relaxed">
            {goalPreview(item.title)}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {relativeTime(item.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="size-3" />
              {item.last_seq} evts
            </span>
            <span className="flex items-center gap-1">
              <Hash className="size-3" />
              {item.id.slice(0, 8)}
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 text-[9px] font-medium rounded-full px-2 py-0.5 border ${pill.cls}`}
        >
          {pill.label}
        </span>
      </div>
    </button>
  );
}
