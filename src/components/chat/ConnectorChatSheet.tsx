"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plug, ExternalLink, Trash2, Activity } from "lucide-react";
import { useConnectorsStore } from "@/lib/stores/connectors-store";
import { STATUS_COLORS, CONNECTOR_TYPE_LABELS } from "@/lib/connectors/types";
import { ConnectorTypeIcon } from "@/components/connectors/ConnectorTypeIcon";
import Link from "next/link";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectorChatSheet({ isOpen, onClose }: Props) {
  const connectors = useConnectorsStore((s) => s.connectors);
  const testConnection = useConnectorsStore((s) => s.testConnection);
  const removeConnector = useConnectorsStore((s) => s.removeConnector);

  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTest = async (id: string) => {
    setTestingId(id);
    await testConnection(id);
    setTestingId(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[420px] max-w-[90vw] z-50
              bg-[#0a0a12]/95 backdrop-blur-3xl border-l border-white/[0.06]
              shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.8)]
              flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-sm font-bold text-white">Connectors</h2>
                <p className="text-[11px] text-neutral-500">MCP servers, APIs, n8n, SDKs</p>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/[0.06] rounded-lg text-neutral-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connected list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {connectors.length === 0 ? (
                <div className="py-12 text-center">
                  <Plug className="w-8 h-8 mx-auto mb-3 text-neutral-700" />
                  <p className="text-sm text-neutral-400">No connectors configured</p>
                  <p className="text-xs text-neutral-600 mt-1">Install from the Marketplace to get started</p>
                </div>
              ) : (
                connectors.map((conn) => (
                  <div key={conn.id} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 hover:border-white/[0.08] transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full mt-0.5 ${STATUS_COLORS[conn.status]}`} />
                        <div>
                          <p className="text-xs font-semibold text-neutral-200">{conn.name}</p>
                          <p className="text-[10px] text-neutral-500">
                            {CONNECTOR_TYPE_LABELS[conn.type]} &bull; {conn.transport || 'http'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                          conn.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' :
                          conn.status === 'error' ? 'bg-red-500/10 text-red-400' :
                          'bg-zinc-500/10 text-zinc-400'
                        }`}
                      >
                        {conn.status}
                      </span>
                    </div>

                    {conn.endpoint && (
                      <p className="text-[10px] text-neutral-600 font-mono mb-3 truncate">{conn.endpoint}</p>
                    )}

                    {conn.errorMessage && (
                      <p className="text-[10px] text-red-400/80 mb-2">{conn.errorMessage}</p>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTest(conn.id)}
                        disabled={testingId === conn.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-medium text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                      >
                        <Activity className="w-3 h-3" />
                        {testingId === conn.id ? 'Testing...' : 'Test'}
                      </button>
                      <Link
                        href={`/connectors/${conn.id}`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-medium text-neutral-400 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Details
                      </Link>
                      <button
                        onClick={() => removeConnector(conn.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-red-500/10 text-[10px] font-medium text-neutral-600 hover:text-red-400 transition-colors ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.06] p-4">
              <Link
                href="/connectors"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 text-xs font-semibold text-purple-400 transition-colors"
              >
                <Plug className="w-3.5 h-3.5" />
                Open Connector Dashboard
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
