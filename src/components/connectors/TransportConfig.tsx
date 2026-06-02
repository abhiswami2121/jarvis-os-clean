// ─── TransportConfig ──────────────────────────────────────────────────
'use client';
import { cn } from '@/lib/utils';
import { TRANSPORT_LABELS, type ConnectorTransport } from '@/lib/connectors/types';
import { Terminal, Radio, Globe, Wifi } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICONS: Record<ConnectorTransport, LucideIcon> = {
  stdio: Terminal,
  sse: Radio,
  http: Globe,
  websocket: Wifi,
};

interface Props {
  value: ConnectorTransport;
  onChange: (t: ConnectorTransport) => void;
}

export function TransportConfig({ value, onChange }: Props) {
  const transports: ConnectorTransport[] = ['http', 'sse', 'websocket', 'stdio'];

  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-2">Transport</label>
      <div className="grid grid-cols-2 gap-2">
        {transports.map((t) => {
          const Icon = ICONS[t];
          const isActive = value === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all',
                isActive
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:border-white/[0.12] hover:text-zinc-300'
              )}
            >
              <Icon className="size-3.5" />
              {TRANSPORT_LABELS[t]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
