// ─── Connector Detail Page ────────────────────────────────────────────
'use client';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play, Settings, Trash2, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useConnectorsStore } from '@/lib/stores/connectors-store';
import { ConnectorStatusPill } from '@/components/connectors/ConnectorStatusPill';
import { ConnectorTypeIcon } from '@/components/connectors/ConnectorTypeIcon';
import { CONNECTOR_TYPE_LABELS, TRANSPORT_LABELS, AUTH_TYPE_LABELS } from '@/lib/connectors/types';

export default function ConnectorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useConnectorsStore();
  const connector = store.connectors.find((c) => c.id === id);
  const [copied, setCopied] = useState(false);

  if (!connector) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Connector not found</p>
          <Link href="/connectors" className="text-emerald-400 hover:text-emerald-300 text-sm">Back to Connectors</Link>
        </div>
      </div>
    );
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#08080f]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          href="/connectors"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-200 transition-colors mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to Connectors
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <ConnectorTypeIcon type={connector.type} size="md" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-zinc-100">{connector.name}</h1>
              <ConnectorStatusPill status={connector.status} />
            </div>
            <p className="text-sm text-zinc-500">{connector.description || 'No description'}</p>
          </div>
        </div>

        {/* Details Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md p-5 space-y-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Type</span>
              <p className="text-sm text-zinc-300 mt-0.5">{CONNECTOR_TYPE_LABELS[connector.type]}</p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Transport</span>
              <p className="text-sm text-zinc-300 mt-0.5">{TRANSPORT_LABELS[connector.transport]}</p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Auth</span>
              <p className="text-sm text-zinc-300 mt-0.5">{AUTH_TYPE_LABELS[connector.authType]}</p>
            </div>
            {connector.version && (
              <div>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Version</span>
                <p className="text-sm text-zinc-300 mt-0.5">v{connector.version}</p>
              </div>
            )}
            <div>
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Created</span>
              <p className="text-sm text-zinc-300 mt-0.5">{new Date(connector.createdAt).toLocaleDateString()}</p>
            </div>
            {connector.lastTested && (
              <div>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Last Tested</span>
                <p className="text-sm text-zinc-300 mt-0.5">{new Date(connector.lastTested).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Endpoint */}
        {connector.endpoint && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md p-5 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 font-medium">Endpoint</span>
              <button onClick={() => handleCopy(connector.endpoint!)} className="text-zinc-600 hover:text-zinc-400">
                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            <p className="text-sm text-zinc-400 font-mono break-all">{connector.endpoint}</p>
          </div>
        )}

        {/* Tags */}
        {connector.tags && connector.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {connector.tags.map((tag) => (
              <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05] text-zinc-500">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Error */}
        {connector.errorMessage && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 mb-6">
            <p className="text-sm text-red-400">{connector.errorMessage}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => store.testConnection(connector.id)}
            disabled={connector.status === 'testing'}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/[0.12] transition-all disabled:opacity-50"
          >
            <Play className="size-4" />
            Test Connection
          </button>
          <button
            onClick={() => store.openForm(connector)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] transition-all"
          >
            <Settings className="size-4" />
            Edit
          </button>
          <button
            onClick={() => { store.removeConnector(connector.id); router.push('/connectors'); }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/[0.08] transition-all"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
