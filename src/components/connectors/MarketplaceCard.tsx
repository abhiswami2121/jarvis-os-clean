// ─── MarketplaceCard ──────────────────────────────────────────────────
'use client';
import { motion } from 'motion/react';
import { Star, Download, ArrowDownToLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketplaceEntry } from '@/lib/connectors/types';
import { CONNECTOR_TYPE_LABELS } from '@/lib/connectors/types';
import { ConnectorTypeIcon } from './ConnectorTypeIcon';

interface Props {
  entry: MarketplaceEntry;
  onInstall: (entry: MarketplaceEntry) => void;
}

export function MarketplaceCard({ entry, onInstall }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'group rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md p-4',
        'hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200',
        'hover:shadow-[0_20px_60px_-20px_rgba(168,85,247,0.08)]'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <ConnectorTypeIcon type={entry.type} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-zinc-200 truncate">{entry.name}</h4>
          <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{entry.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-3">
        <span className="flex items-center gap-1 text-[11px] text-zinc-500">
          <Star className="size-3 text-amber-400 fill-amber-400" />
          {entry.rating}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-zinc-600">
          <Download className="size-3" />
          {entry.installs.toLocaleString()}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05] text-zinc-500 ml-auto">
          {CONNECTOR_TYPE_LABELS[entry.type]}
        </span>
      </div>

      {/* Install Button */}
      <button
        onClick={() => onInstall(entry)}
        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-xs font-medium text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/[0.12] transition-all"
      >
        <ArrowDownToLine className="size-3.5" />
        Install
      </button>
    </motion.div>
  );
}
