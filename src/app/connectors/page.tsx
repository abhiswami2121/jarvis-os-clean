// ─── Connectors Page ──────────────────────────────────────────────────
// Phase 11.1 — MCP Marketplace & Connection Management
'use client';
import { useConnectorsStore } from '@/lib/stores/connectors-store';
import { ConnectorsHeader } from '@/components/connectors/ConnectorsHeader';
import { ConnectorList } from '@/components/connectors/ConnectorList';
import { ConnectionFormModal } from '@/components/connectors/ConnectionFormModal';
import { MarketplacePanel } from '@/components/connectors/MarketplacePanel';
import { ConnectorDetailSheet } from '@/components/connectors/ConnectorDetailSheet';

export default function ConnectorsPage() {
  const connectors = useConnectorsStore((s) => s.connectors);

  return (
    <div className="min-h-screen bg-[#08080f]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <ConnectorsHeader connectorCount={connectors.length} />
        <ConnectorList />
      </div>

      {/* Modals & Panels */}
      <ConnectionFormModal />
      <MarketplacePanel />
      <ConnectorDetailSheet />
    </div>
  );
}
