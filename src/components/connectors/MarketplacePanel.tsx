// ─── MarketplacePanel ─────────────────────────────────────────────────
'use client';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { useConnectorsStore } from '@/lib/stores/connectors-store';
import { MarketplaceSearch } from './MarketplaceSearch';
import { MarketplaceCard } from './MarketplaceCard';

export function MarketplacePanel() {
  const store = useConnectorsStore();
  const {
    marketplaceOpen, toggleMarketplace, marketplaceSearch,
    marketplaceCategory, setMarketplaceSearch, setMarketplaceCategory,
    installFromMarketplace, getFilteredMarketplace,
  } = store;

  const entries = getFilteredMarketplace();

  return (
    <AnimatePresence>
      {marketplaceOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMarketplace}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel — slides from right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-white/[0.08] bg-[#08080f]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Sparkles className="size-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">Marketplace</h2>
                  <p className="text-[11px] text-zinc-500">Browse & install connectors</p>
                </div>
              </div>
              <button onClick={toggleMarketplace} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors">
                <X className="size-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-white/[0.04] shrink-0">
              <MarketplaceSearch
                value={marketplaceSearch}
                onChange={setMarketplaceSearch}
                category={marketplaceCategory}
                onCategoryChange={setMarketplaceCategory}
              />
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-zinc-500">No connectors found</p>
                  <p className="text-xs text-zinc-600 mt-1">Try a different search or category</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {entries.map((entry) => (
                    <MarketplaceCard
                      key={entry.id}
                      entry={entry}
                      onInstall={installFromMarketplace}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-3 border-t border-white/[0.06]">
              <p className="text-[10px] text-zinc-600 text-center">
                {entries.length} connector{entries.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
