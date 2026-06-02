// ─── ConnectorStatusPill ─────────────────────────────────────────────
'use client';
import { cn } from '@/lib/utils';
import { STATUS_COLORS, STATUS_LABELS, type ConnectorStatus } from '@/lib/connectors/types';

interface Props {
  status: ConnectorStatus;
  className?: string;
}

export function ConnectorStatusPill({ status, className }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400', className)}>
      <span className={cn('size-1.5 rounded-full', STATUS_COLORS[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}
