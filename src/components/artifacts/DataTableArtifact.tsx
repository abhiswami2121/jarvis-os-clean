"use client";

import { useState, useMemo, useCallback } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronRight, Table2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ActionButton } from "@/components/artifacts/ActionButton";
import type { DataTableArtifact as DataTableArtifactType, ColumnDef } from "@/lib/artifacts/types";

// ── Constants ───────────────────────────────────────────────────
const INITIAL_VISIBLE = 10;
const MAX_ROWS = 200;

// ── Cell Formatters ─────────────────────────────────────────────

/** Simple relative date formatter (no deps needed) */
function formatRelativeDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(value as string | number);
  if (isNaN(d.getTime())) return String(value);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;

  // Fallback to short date
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
}

function formatCurrency(value: unknown): string {
  const n = Number(value);
  if (isNaN(n)) return String(value || "—");
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function formatNumber(value: unknown): string {
  const n = Number(value);
  if (isNaN(n)) return String(value || "—");
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDate(value: unknown, fmt?: string): string {
  if (!value) return "—";
  const d = new Date(value as string | number);
  if (isNaN(d.getTime())) return String(value);
  if (fmt === "relative") return formatRelativeDate(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Status Badge Colors ─────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  healthy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",

  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  yellow: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  at_risk: "bg-amber-500/15 text-amber-300 border-amber-500/30",

  error: "bg-red-500/15 text-red-300 border-red-500/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
  declined: "bg-red-500/15 text-red-300 border-red-500/30",
  critical: "bg-red-500/15 text-red-300 border-red-500/30",
  red: "bg-red-500/15 text-red-300 border-red-500/30",

  cancelled: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  inactive: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  gray: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

function statusColor(value: unknown): string {
  const s = String(value || "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return STATUS_COLORS[s] || "bg-zinc-500/15 text-zinc-300 border-zinc-500/25";
}

// ── Cell Renderer ───────────────────────────────────────────────
function renderCell(value: unknown, col: ColumnDef): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-zinc-600">—</span>;
  }

  switch (col.type) {
    case "currency":
      return <span className="tabular-nums font-mono text-xs">{formatCurrency(value)}</span>;
    case "number":
      return <span className="tabular-nums font-mono text-xs">{formatNumber(value)}</span>;
    case "date":
      return <span className="text-zinc-400 text-xs">{formatDate(value, col.format)}</span>;
    case "status": {
      const s = String(value);
      return (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            statusColor(value)
          )}
        >
          {s}
        </span>
      );
    }
    default:
      return <span className="text-zinc-200 text-xs">{String(value)}</span>;
  }
}

// ── Sort Helpers ────────────────────────────────────────────────
type SortDir = "asc" | "desc" | null;

function sortRows(rows: Record<string, unknown>[], sortKey: string | null, sortDir: SortDir): Record<string, unknown>[] {
  if (!sortKey || !sortDir) return rows;

  return [...rows].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    // Nulls sort last
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    let cmp = 0;
    if (typeof aVal === "number" && typeof bVal === "number") {
      cmp = aVal - bVal;
    } else {
      cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: "base" });
    }

    return sortDir === "asc" ? cmp : -cmp;
  });
}

// ── Main Component ──────────────────────────────────────────────
interface DataTableArtifactProps {
  artifact: DataTableArtifactType;
  className?: string;
}

export function DataTableArtifact({ artifact, className }: DataTableArtifactProps) {
  const { title, subtitle, columns, rows, actions, metadata } = artifact;
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [expanded, setExpanded] = useState(false);

  // Clamp rows to MAX_ROWS
  const displayRows = useMemo(() => rows.slice(0, MAX_ROWS), [rows]);
  const totalRows = metadata?.totalRows ?? rows.length;
  const isTruncated = rows.length > MAX_ROWS || (metadata?.truncated ?? false);
  const needsCollapse = displayRows.length > INITIAL_VISIBLE;

  // Sort
  const sortedRows = useMemo(
    () => sortRows(displayRows, sortKey, sortDir),
    [displayRows, sortKey, sortDir]
  );

  const visibleRows = needsCollapse && !expanded
    ? sortedRows.slice(0, INITIAL_VISIBLE)
    : sortedRows;

  const hiddenCount = needsCollapse && !expanded
    ? sortedRows.length - INITIAL_VISIBLE
    : 0;

  // Sort toggle handler
  const handleSort = useCallback(
    (key: string) => {
      setSortKey((prev) => {
        if (prev === key) {
          setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
          return prev;
        }
        setSortDir("asc");
        return key;
      });
    },
    []
  );

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ArrowUpDown className="size-3 text-zinc-600 opacity-50" />;
    if (sortDir === "asc") return <ArrowUp className="size-3 text-emerald-400" />;
    if (sortDir === "desc") return <ArrowDown className="size-3 text-emerald-400" />;
    return <ArrowUpDown className="size-3 text-zinc-600 opacity-50" />;
  };

  const handleActionExecute = useCallback((intent: string, payload?: unknown) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("jarvis:artifact-action", {
          detail: { intent, payload, source: "data_table", tableTitle: title },
        })
      );
    }
  }, [title]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "my-3 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm",
        className
      )}
    >
      {/* ── Header ── */}
      <div className="min-h-[240px] flex items-center gap-2.5 border-b border-white/[0.04] px-4 py-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Table2 className="size-3.5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100 truncate">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-zinc-500 truncate">{subtitle}</p>
          )}
        </div>
        {totalRows > 0 && (
          <span className="flex-shrink-0 rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] text-zinc-500 font-mono">
            {totalRows} rows
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.04] bg-white/[0.01]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap",
                    col.sortable !== false && "cursor-pointer select-none hover:text-zinc-200 transition-colors"
                  )}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && <SortIcon colKey={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {visibleRows.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                      {renderCell(row[col.key], col)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {/* Empty state */}
        {visibleRows.length === 0 && (
          <div className="py-12 text-center text-[11px] text-zinc-600">
            No data to display
          </div>
        )}
      </div>

      {/* ── Expand/Collapse ── */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-white/[0.04] py-2 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] transition-colors"
        >
          <ChevronDown className="size-3" />
          Show {hiddenCount} more rows
        </button>
      )}
      {needsCollapse && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-white/[0.04] py-2 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] transition-colors"
        >
          <ChevronRight className="size-3" />
          Show less
        </button>
      )}

      {/* Truncation notice */}
      {isTruncated && (
        <div className="border-t border-amber-500/[0.08] bg-amber-500/[0.02] px-4 py-1.5 text-[10px] text-amber-400/70">
          Showing {MAX_ROWS} of {totalRows} total rows. Refine your query for the full dataset.
        </div>
      )}

      {/* ── Action Bar ── */}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.04] px-4 py-2.5">
          {actions.map((action, i) => (
            <ActionButton
              key={`${action.intent}-${i}`}
              action={action}
              onExecute={handleActionExecute}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default DataTableArtifact;
