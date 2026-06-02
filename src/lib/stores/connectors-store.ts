// ─── Connectors Zustand Store ─────────────────────────────────────────
// Phase 11.1 — Central state for all connector management
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConnectorDefinition, ConnectorStatus, MarketplaceEntry } from '@/lib/connectors/types';
import { generateConnectorId } from '@/lib/connectors/types';
import { MARKETPLACE_ENTRIES } from '@/lib/connectors/marketplace-data';

// ─── Store Shape ──────────────────────────────────────────────────────

interface ConnectorsState {
  // Data
  connectors: ConnectorDefinition[];
  marketplace: MarketplaceEntry[];

  // UI State
  selectedConnectorId: string | null;
  marketplaceOpen: boolean;
  formOpen: boolean;
  detailOpen: boolean;
  editingConnector: ConnectorDefinition | null;
  marketplaceSearch: string;
  marketplaceCategory: string;
  formError: string | null;

  // Actions
  setSelectedConnector: (id: string | null) => void;
  toggleMarketplace: () => void;
  openForm: (connector?: ConnectorDefinition | null) => void;
  closeForm: () => void;
  openDetail: (id: string) => void;
  closeDetail: () => void;
  setMarketplaceSearch: (q: string) => void;
  setMarketplaceCategory: (cat: string) => void;

  // CRUD
  addConnector: (def: Omit<ConnectorDefinition, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateConnector: (id: string, patch: Partial<ConnectorDefinition>) => void;
  removeConnector: (id: string) => void;
  setConnectorStatus: (id: string, status: ConnectorStatus, errorMessage?: string) => void;

  // Marketplace
  installFromMarketplace: (entry: MarketplaceEntry) => void;

  // Testing
  testConnection: (id: string) => Promise<boolean>;

  // Helpers
  getFilteredMarketplace: () => MarketplaceEntry[];
}

// ─── Store Implementation ─────────────────────────────────────────────

export const useConnectorsStore = create<ConnectorsState>()(
  persist(
    (set, get) => ({
      connectors: [],
      marketplace: MARKETPLACE_ENTRIES,
      selectedConnectorId: null,
      marketplaceOpen: false,
      formOpen: false,
      detailOpen: false,
      editingConnector: null,
      marketplaceSearch: '',
      marketplaceCategory: 'all',
      formError: null,

      setSelectedConnector: (id) => set({ selectedConnectorId: id }),
      toggleMarketplace: () => set((s) => ({ marketplaceOpen: !s.marketplaceOpen })),
      openForm: (connector) => set({ formOpen: true, editingConnector: connector ?? null, formError: null }),
      closeForm: () => set({ formOpen: false, editingConnector: null, formError: null }),
      openDetail: (id) => set({ detailOpen: true, selectedConnectorId: id }),
      closeDetail: () => set({ detailOpen: false, selectedConnectorId: null }),
      setMarketplaceSearch: (q) => set({ marketplaceSearch: q }),
      setMarketplaceCategory: (cat) => set({ marketplaceCategory: cat }),

      addConnector: (def) => {
        const id = generateConnectorId();
        const now = Date.now();
        const connector: ConnectorDefinition = {
          ...def,
          id,
          status: def.endpoint || def.serverCommand ? 'disconnected' : 'configuring' as ConnectorStatus,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ connectors: [...s.connectors, connector], formOpen: false, editingConnector: null }));
      },

      updateConnector: (id, patch) =>
        set((s) => ({
          connectors: s.connectors.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
          ),
        })),

      removeConnector: (id) =>
        set((s) => ({
          connectors: s.connectors.filter((c) => c.id !== id),
          selectedConnectorId: s.selectedConnectorId === id ? null : s.selectedConnectorId,
        })),

      setConnectorStatus: (id, status, errorMessage) =>
        set((s) => ({
          connectors: s.connectors.map((c) =>
            c.id === id
              ? { ...c, status, errorMessage: errorMessage ?? c.errorMessage, lastTested: Date.now(), updatedAt: Date.now() }
              : c
          ),
        })),

      installFromMarketplace: (entry) => {
        const id = generateConnectorId();
        const now = Date.now();
        const connector: ConnectorDefinition = {
          id,
          name: entry.name,
          type: entry.type,
          description: entry.description,
          icon: entry.icon,
          transport: entry.transport,
          authType: entry.authTypes[0] ?? 'api_key',
          endpoint: entry.configTemplate.endpoint,
          status: 'configuring',
          createdAt: now,
          updatedAt: now,
          category: entry.category,
          tags: entry.configTemplate.tags ?? [],
          version: entry.version,
          ...entry.configTemplate,
        };
        set((s) => ({
          connectors: [...s.connectors, connector],
          marketplaceOpen: false,
          editingConnector: connector,
          formOpen: true,
        }));
      },

      testConnection: async (id) => {
        const connector = get().connectors.find((c) => c.id === id);
        if (!connector) return false;

        set((s) => ({
          connectors: s.connectors.map((c) =>
            c.id === id ? { ...c, status: 'testing' as ConnectorStatus } : c
          ),
        }));

        try {
          // Attempt a lightweight request to the endpoint
          const headers: Record<string, string> = { ...connector.headers };
          if (connector.authType === 'api_key' && connector.apiKey) {
            headers['Authorization'] = `Bearer ${connector.apiKey}`;
          } else if (connector.authType === 'bearer' && connector.apiKey) {
            headers['Authorization'] = `Bearer ${connector.apiKey}`;
          } else if (connector.authType === 'basic' && connector.apiKey) {
            headers['Authorization'] = `Basic ${btoa(connector.apiKey)}`;
          }

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);

          const res = await fetch(connector.endpoint ?? '', {
            method: 'HEAD',
            headers,
            signal: controller.signal,
          }).catch(() => null);

          clearTimeout(timeout);

          const connected = res !== null && res.ok;
          set((s) => ({
            connectors: s.connectors.map((c) =>
              c.id === id
                ? { ...c, status: connected ? 'connected' : 'error', errorMessage: connected ? undefined : 'Connection failed', lastTested: Date.now(), updatedAt: Date.now() }
                : c
            ),
          }));
          return connected;
        } catch {
          set((s) => ({
            connectors: s.connectors.map((c) =>
              c.id === id
                ? { ...c, status: 'error', errorMessage: 'Connection failed', lastTested: Date.now(), updatedAt: Date.now() }
                : c
            ),
          }));
          return false;
        }
      },

      getFilteredMarketplace: () => {
        const { marketplace, marketplaceSearch, marketplaceCategory } = get();
        let filtered = marketplace;

        if (marketplaceCategory && marketplaceCategory !== 'all') {
          filtered = filtered.filter((e) => e.category === marketplaceCategory);
        }
        if (marketplaceSearch) {
          const q = marketplaceSearch.toLowerCase();
          filtered = filtered.filter(
            (e) =>
              e.name.toLowerCase().includes(q) ||
              e.description.toLowerCase().includes(q) ||
              e.tags?.some((t: string) => t.toLowerCase().includes(q))
          );
        }
        return filtered;
      },
    }),
    {
      name: 'jarvis-os-connectors',
      partialize: (state) => ({
        connectors: state.connectors.map((c) => ({
          ...c,
          // Strip sensitive fields from localStorage
          apiKey: undefined,
          oauthConfig: c.oauthConfig ? { ...c.oauthConfig, clientSecret: undefined, accessToken: undefined, refreshToken: undefined } : undefined,
        })),
      }),
    }
  )
);
