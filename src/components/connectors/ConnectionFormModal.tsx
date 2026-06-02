// ─── ConnectionFormModal ──────────────────────────────────────────────
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConnectorsStore } from '@/lib/stores/connectors-store';
import { TransportConfig } from './TransportConfig';
import { ApiKeyEntry } from './ApiKeyEntry';
import type { ConnectorDefinition, ConnectorAuthType, ConnectorTransport, ConnectorType } from '@/lib/connectors/types';
import { CONNECTOR_TYPE_LABELS } from '@/lib/connectors/types';

export function ConnectionFormModal() {
  const store = useConnectorsStore();
  const { formOpen, editingConnector, closeForm, addConnector, updateConnector } = store;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ConnectorType>('mcp');
  const [transport, setTransport] = useState<ConnectorTransport>('http');
  const [authType, setAuthType] = useState<ConnectorAuthType>('api_key');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingConnector) {
      setName(editingConnector.name);
      setDescription(editingConnector.description || '');
      setType(editingConnector.type);
      setTransport(editingConnector.transport);
      setAuthType(editingConnector.authType);
      setEndpoint(editingConnector.endpoint || '');
      setApiKey(editingConnector.apiKey || '');
      setHeaders(editingConnector.headers || {});
      setError(null);
    } else {
      resetForm();
    }
  }, [editingConnector, formOpen]);

  function resetForm() {
    setName('');
    setDescription('');
    setType('mcp');
    setTransport('http');
    setAuthType('api_key');
    setEndpoint('');
    setApiKey('');
    setHeaders({});
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const def = {
      name: name.trim(),
      description: description.trim(),
      type,
      transport,
      authType,
      endpoint: endpoint.trim() || undefined,
      apiKey: apiKey || undefined,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      icon: 'Plug',
      category: type === 'mcp' ? 'mcp' : type === 'n8n' ? 'n8n' : 'api',
      tags: [],
    };

    if (editingConnector) {
      updateConnector(editingConnector.id, { ...def, updatedAt: Date.now() });
    } else {
      addConnector(def);
    }
    resetForm();
    closeForm();
  }

  const connectorTypes: ConnectorType[] = ['mcp', 'custom_api', 'n8n', 'typescript_sdk'];

  return (
    <AnimatePresence>
      {formOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeForm}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-lg rounded-3xl border border-white/[0.08] bg-[#0b0d13]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  {editingConnector ? <Save className="size-4 text-emerald-400" /> : <Plus className="size-4 text-emerald-400" />}
                </div>
                <h2 className="text-sm font-semibold text-zinc-200">
                  {editingConnector ? 'Edit Connector' : 'New Connector'}
                </h2>
              </div>
              <button onClick={closeForm} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors">
                <X className="size-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Slack MCP"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Send messages and manage channels"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all"
                />
              </div>

              {/* Type Selector */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Connector Type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {connectorTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        'rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-all',
                        type === t
                          ? t === 'mcp' ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                          : t === 'custom_api' ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                          : t === 'n8n' ? 'border-pink-500/40 bg-pink-500/10 text-pink-300'
                          : 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                          : 'border-white/[0.05] bg-white/[0.02] text-zinc-500 hover:border-white/[0.10]'
                      )}
                    >
                      {CONNECTOR_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transport */}
              <TransportConfig value={transport} onChange={setTransport} />

              {/* Auth + Endpoint */}
              <ApiKeyEntry
                authType={authType}
                onAuthTypeChange={setAuthType}
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                endpoint={endpoint}
                onEndpointChange={setEndpoint}
                headers={headers}
                onHeadersChange={setHeaders}
                error={error}
              />

              {/* Submit */}
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all"
              >
                {editingConnector ? 'Save Changes' : 'Add Connector'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
