// ─── ConnectorDetailSheet ─────────────────────────────────────────────
'use client';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Settings, Play, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useConnectorsStore } from '@/lib/stores/connectors-store';
import { ConnectorStatusPill } from './ConnectorStatusPill';
import { ConnectorTypeIcon } from './ConnectorTypeIcon';
import { CONNECTOR_TYPE_LABELS, TRANSPORT_LABELS, AUTH_TYPE_LABELS } from '@/lib/connectors/types';

export function ConnectorDetailSheet() {
  const store = useConnectorsStore();
  const { detailOpen, selectedConnectorId, closeDetail, connectors, removeConnector, testConnection, openForm } = store;
  const connector = connectors.find((c) => c.id === selectedConnectorId);
  const [copied, setCopied] = useState(false);

  if (!connector) return null;

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AnimatePresence>
      {detailOpen && connector && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetail}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-white/[0.08] bg-[#08080f]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2.5">
                <ConnectorTypeIcon type={connector.type} />
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">{connector.name}</h3>
                  <ConnectorStatusPill status={connector.status} />
                </div>
              </div>
              <button onClick={closeDetail} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]">
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Description */}
              <div>
                <p className="text-sm text-zinc-400">{connector.description || 'No description'}</p>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Type</span>
                  <span className="text-zinc-300">{CONNECTOR_TYPE_LABELS[connector.type]}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Transport</span>
                  <span className="text-zinc-300">{TRANSPORT_LABELS[connector.transport]}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Auth</span>
                  <span className="text-zinc-300">{AUTH_TYPE_LABELS[connector.authType]}</span>
                </div>
                {connector.version && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Version</span>
                    <span className="text-zinc-300">v{connector.version}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Created</span>
                  <span className="text-zinc-300">{new Date(connector.createdAt).toLocaleDateString()}</span>
                </div>
                {connector.lastTested && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Last Tested</span>
                    <span className="text-zinc-300">{new Date(connector.lastTested).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Endpoint */}
              {connector.endpoint && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-zinc-500 font-medium">Endpoint</span>
                    <button
                      onClick={() => handleCopy(connector.endpoint!)}
                      className="text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono break-all">{connector.endpoint}</p>
                </div>
              )}

              {/* Tags */}
              {connector.tags && connector.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {connector.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05] text-zinc-500">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Error message */}
              {connector.errorMessage && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-xs text-red-400">{connector.errorMessage}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="shrink-0 border-t border-white/[0.06] p-3 space-y-2">
              <button
                onClick={() => testConnection(connector.id)}
                disabled={connector.status === 'testing'}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/[0.12] transition-all disabled:opacity-50"
              >
                <Play className="size-4" />
                Test Connection
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => { closeDetail(); openForm(connector); }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.06] transition-all"
                >
                  <Settings className="size-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => { removeConnector(connector.id); closeDetail(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/[0.08] transition-all"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
