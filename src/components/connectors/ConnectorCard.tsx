// ─── ConnectorCard ────────────────────────────────────────────────────
'use client';
import { motion } from 'motion/react';
import { Settings, Trash2, Play, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectorDefinition } from '@/lib/connectors/types';
import { CONNECTOR_TYPE_LABELS } from '@/lib/connectors/types';
import { ConnectorStatusPill } from './ConnectorStatusPill';
import { ConnectorTypeIcon } from './ConnectorTypeIcon';

interface Props {
  connector: ConnectorDefinition;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onDetail: (id: string) => void;
  isSelected?: boolean;
}

export function ConnectorCard({ connector, onEdit, onDelete, onTest, onDetail, isSelected }: Props) {
  const isConnected = connector.status === 'connected';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={() => onDetail(connector.id)}
      className={cn(
        'group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200',
        'bg-white/[0.02] backdrop-blur-md',
        isSelected
          ? 'border-emerald-500/40 shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]'
          : 'border-white/[0.05] hover:border-white/[0.10] hover:bg-white/[0.04]',
        'hover:shadow-[0_20px_60px_-20px_rgba(168,85,247,0.10)]'
      )}
    >
      {/* Status ring */}
      <div
        className={cn(
          'absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-[#08080f]',
          isConnected ? 'bg-emerald-500' : connector.status === 'error' ? 'bg-red-500' : 'bg-zinc-600'
        )}
      />

      {/* Header */}
      <div className="flex items-start gap-3">
        <ConnectorTypeIcon type={connector.type} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100 truncate">{connector.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{connector.description}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05] text-zinc-500">
          {CONNECTOR_TYPE_LABELS[connector.type]}
        </span>
        <ConnectorStatusPill status={connector.status} />
        {connector.version && (
          <span className="text-[10px] text-zinc-600 ml-auto">v{connector.version}</span>
        )}
      </div>

      {/* Actions — visible on hover */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => { e.stopPropagation(); onTest(connector.id); }}
          disabled={connector.status === 'testing'}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          title="Test connection"
        >
          <Play className="size-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(connector.id); }}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors"
          title="Edit connector"
        >
          <Settings className="size-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(connector.id); }}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete connector"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Endpoint preview for connected connectors */}
      {connector.endpoint && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-600 truncate">
          <ExternalLink className="size-2.5 shrink-0" />
          <span className="truncate">{connector.endpoint}</span>
        </div>
      )}
    </motion.div>
  );
}
