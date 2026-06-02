// ─── EmptyState ───────────────────────────────────────────────────────
'use client';
import { Plug } from 'lucide-react';

interface Props {
  onAdd: () => void;
  onMarketplace: () => void;
}

export function EmptyState({ onAdd, onMarketplace }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="size-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
        <Plug className="size-7 text-zinc-600" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-300 mb-1.5">No connectors yet</h3>
      <p className="text-sm text-zinc-500 text-center max-w-sm mb-6">
        Connect MCP servers, APIs, n8n workflows, and SDKs to give Jarvis superpowers.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 backdrop-blur-md hover:border-white/[0.15] hover:bg-white/[0.08] transition-all"
        >
          <Plug className="size-4" />
          Add Connector
        </button>
        <button
          onClick={onMarketplace}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5 text-sm font-medium text-emerald-400 backdrop-blur-md hover:border-emerald-500/30 hover:bg-emerald-500/[0.10] transition-all"
        >
          Browse Marketplace
        </button>
      </div>
    </div>
  );
}
