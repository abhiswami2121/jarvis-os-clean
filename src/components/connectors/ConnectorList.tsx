// ─── ConnectorList ────────────────────────────────────────────────────
'use client';
import { AnimatePresence } from 'motion/react';
import { useConnectorsStore } from '@/lib/stores/connectors-store';
import { ConnectorCard } from './ConnectorCard';
import { EmptyState } from './EmptyState';

export function ConnectorList() {
  const store = useConnectorsStore();
  const { connectors, openForm, toggleMarketplace, openDetail, removeConnector, testConnection } = store;

  if (connectors.length === 0) {
    return <EmptyState onAdd={() => openForm(null)} onMarketplace={toggleMarketplace} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <AnimatePresence mode="popLayout">
        {connectors.map((connector) => (
          <ConnectorCard
            key={connector.id}
            connector={connector}
            onEdit={(id) => openForm(connectors.find((c) => c.id === id) ?? null)}
            onDelete={removeConnector}
            onTest={testConnection}
            onDetail={openDetail}
            isSelected={store.selectedConnectorId === connector.id}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
