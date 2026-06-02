// ─── MarketplaceSearch ────────────────────────────────────────────────
'use client';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (v: string) => void;
  category: string;
  onCategoryChange: (c: string) => void;
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'featured', label: 'Featured' },
  { key: 'mcp', label: 'MCP Servers' },
  { key: 'api', label: 'APIs' },
  { key: 'n8n', label: 'n8n' },
  { key: 'sdk', label: 'SDKs' },
];

export function MarketplaceSearch({ value, onChange, category, onCategoryChange }: Props) {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-600" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search connectors…"
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-all"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onCategoryChange(cat.key)}
            className={cn(
              'shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all',
              category === cat.key
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-white/[0.05] bg-white/[0.02] text-zinc-500 hover:border-white/[0.10] hover:text-zinc-300'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
