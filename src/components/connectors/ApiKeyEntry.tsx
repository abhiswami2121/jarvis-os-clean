// ─── ApiKeyEntry ──────────────────────────────────────────────────────
'use client';
import { useState } from 'react';
import { Eye, EyeOff, Key } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectorAuthType } from '@/lib/connectors/types';
import { AUTH_TYPE_LABELS } from '@/lib/connectors/types';

interface Props {
  authType: ConnectorAuthType;
  onAuthTypeChange: (t: ConnectorAuthType) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  endpoint: string;
  onEndpointChange: (url: string) => void;
  headers: Record<string, string>;
  onHeadersChange: (h: Record<string, string>) => void;
  error?: string | null;
}

export function ApiKeyEntry({
  authType, onAuthTypeChange, apiKey, onApiKeyChange,
  endpoint, onEndpointChange, headers, onHeadersChange, error,
}: Props) {
  const [showKey, setShowKey] = useState(false);
  const authTypes: ConnectorAuthType[] = ['none', 'api_key', 'bearer', 'basic'];

  return (
    <div className="space-y-4">
      {/* Endpoint URL */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Endpoint URL</label>
        <input
          type="url"
          value={endpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
          placeholder="https://api.example.com/v1"
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all"
        />
      </div>

      {/* Auth Type Selector */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">Authentication</label>
        <div className="grid grid-cols-4 gap-1.5">
          {authTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onAuthTypeChange(t)}
              className={cn(
                'rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-all',
                authType === t
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/[0.05] bg-white/[0.02] text-zinc-500 hover:border-white/[0.10]'
              )}
            >
              {AUTH_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* API Key / Bearer / Basic Input */}
      {authType !== 'none' && (
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            {authType === 'basic' ? 'Username:Password' : authType === 'bearer' ? 'Bearer Token' : 'API Key'}
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-600" />
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder={authType === 'basic' ? 'user:pass' : 'sk-...'}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-9 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
            >
              {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}
