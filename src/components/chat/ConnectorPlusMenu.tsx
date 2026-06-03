"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Plug, ExternalLink } from "lucide-react";
import { useConnectorsStore } from "@/lib/stores/connectors-store";
import { STATUS_COLORS, CONNECTOR_TYPE_LABELS } from "@/lib/connectors/types";
import { ConnectorTypeIcon } from "@/components/connectors/ConnectorTypeIcon";
import Link from "next/link";

interface ConnectorPlusMenuProps {
  onOpenSheet?: () => void;
}

export function ConnectorPlusMenu({ onOpenSheet }: ConnectorPlusMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'connected' | 'marketplace'>('connected');

  const connectors = useConnectorsStore((s) => s.connectors);
  const marketplace = useConnectorsStore((s) => s.getFilteredMarketplace());
  const installFromMarketplace = useConnectorsStore((s) => s.installFromMarketplace);

  const connectedCount = connectors.filter((c) => c.status === 'connected').length;

  return (
    <div className="relative">
      {/* + Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium
          transition-all duration-200
          ${isOpen
            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
            : 'bg-white/[0.03] text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
          }
        `}
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Connect</span>
        {connectedCount > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-[9px] font-bold text-emerald-400">
            {connectedCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 z-50
                bg-[#0d0d14]/95 backdrop-blur-2xl
                border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50
                overflow-hidden"
            >
              {/* Tab bar */}
              <div className="flex border-b border-white/[0.06]">
                <button
                  onClick={() => setActiveTab('connected')}
                  className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors ${
                    activeTab === 'connected'
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Connected ({connectedCount})
                </button>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors ${
                    activeTab === 'marketplace'
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Marketplace
                </button>
              </div>

              {/* Content */}
              <div className="max-h-[400px] overflow-y-auto">
                {activeTab === 'connected' && (
                  <div className="p-2">
                    {connectors.length === 0 ? (
                      <div className="py-8 text-center">
                        <Plug className="w-6 h-6 mx-auto mb-2 text-neutral-600" />
                        <p className="text-xs text-neutral-500">No connectors yet</p>
                        <button
                          onClick={() => setActiveTab('marketplace')}
                          className="mt-2 text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                        >
                          Browse Marketplace &rarr;
                        </button>
                      </div>
                    ) : (
                      <>
                        {connectors.map((conn) => (
                          <div
                            key={conn.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
                          >
                            {/* Status dot */}
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[conn.status]}`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-neutral-200 truncate">{conn.name}</p>
                              <p className="text-[10px] text-neutral-500 truncate">
                                {CONNECTOR_TYPE_LABELS[conn.type]}
                                {conn.endpoint ? ` • ${(() => { try { return new URL(conn.endpoint).hostname; } catch { return conn.endpoint; } })()}` : ' • Not configured'}
                              </p>
                            </div>
                            <div
                              className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                                conn.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' :
                                conn.status === 'disconnected' ? 'bg-zinc-500/10 text-zinc-400' :
                                conn.status === 'error' ? 'bg-red-500/10 text-red-400' :
                                conn.status === 'configuring' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-blue-500/10 text-blue-400'
                              }`}
                            >
                              {conn.status}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'marketplace' && (
                  <div className="p-2">
                    {marketplace.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
                      >
                        <ConnectorTypeIcon type={item.type} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-neutral-200 truncate">{item.name}</p>
                          <p className="text-[10px] text-neutral-500 truncate">{item.description}</p>
                        </div>
                        <button
                          onClick={() => {
                            installFromMarketplace(item);
                            setIsOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-[10px] font-semibold text-purple-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Install
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/[0.06] px-3 py-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSheet?.();
                  }}
                  className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors font-medium"
                >
                  <Plug className="w-3 h-3" />
                  View All Connectors
                </button>
                <Link
                  href="/connectors"
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
                >
                  Dashboard <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
