// ─── ConnectorTypeIcon ────────────────────────────────────────────────
'use client';
import { cn } from '@/lib/utils';
import {
  Plug, Globe, Workflow, Code, type LucideIcon,
} from 'lucide-react';
import type { ConnectorType } from '@/lib/connectors/types';

const ICON_MAP: Record<ConnectorType, LucideIcon> = {
  mcp: Plug,
  custom_api: Globe,
  n8n: Workflow,
  typescript_sdk: Code,
};

const COLOR_MAP: Record<ConnectorType, string> = {
  mcp: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  custom_api: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  n8n: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  typescript_sdk: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

interface Props {
  type: ConnectorType;
  size?: 'sm' | 'md';
  className?: string;
}

export function ConnectorTypeIcon({ type, size = 'md', className }: Props) {
  const Icon = ICON_MAP[type] ?? Plug;
  const sizeClass = size === 'sm' ? 'size-4 p-0.5' : 'size-6 p-1';

  return (
    <span className={cn('rounded-md border flex items-center justify-center', sizeClass, COLOR_MAP[type], className)}>
      <Icon className="size-full" />
    </span>
  );
}
