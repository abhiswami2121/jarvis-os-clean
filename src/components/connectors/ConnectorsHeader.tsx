// ─── ConnectorsHeader ─────────────────────────────────────────────────
'use client';
import { motion } from 'motion/react';
import { Plug, Store, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useConnectorsStore } from '@/lib/stores/connectors-store';

interface Props {
  connectorCount: number;
}

export function ConnectorsHeader({ connectorCount }: Props) {
  const { toggleMarketplace, openForm } = useConnectorsStore();

  return (
    <div className="mb-6">
      {/* Back + Title */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          href="/"
          className="p-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.12] transition-all"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Connectors</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {connectorCount === 0
              ? 'Connect MCP servers, APIs, and workflows'
              : `${connectorCount} connector${connectorCount !== 1 ? 's' : ''} configured`}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openForm(null)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-200 backdrop-blur-md hover:border-white/[0.15] hover:bg-white/[0.06] transition-all"
        >
          <Plus className="size-4" />
          Add Connector
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleMarketplace}
          className="inline-flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] px-4 py-2.5 text-sm font-medium text-purple-300 backdrop-blur-md hover:border-purple-500/30 hover:bg-purple-500/[0.10] transition-all"
        >
          <Store className="size-4" />
          Marketplace
        </motion.button>
      </div>
    </div>
  );
}
