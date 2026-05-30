"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import { Search, Filter, Download, Columns, ArrowUpDown, ArrowUp, ArrowDown, X, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { Artifact, DataTableArtifact as DataTableArtifactType, ColumnDef } from "@/lib/artifacts/types";

// ── Constants ─────────────────────────────────────────────────────
const ROWS_PER_PAGE = 50;

// ── Cell Formatters ───────────────────────────────────────────────

function formatCurrency(value: unknown): string {
  const n = Number(value);
  if (isNaN(n)) return String(value || "—");
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatNumber(value: unknown): string {
  const n = Number(value);
  if (isNaN(n)) return String(value || "—");
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(value as string | number);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  healthy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  at_risk: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  error: "bg-red-500/15 text-red-300 border-red-500/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
  declined: "bg-red-500/15 text-red-300 border-red-500/30",
  critical: "bg-red-500/15 text-red-300 border-red-500/30",
  cancelled: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  inactive: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

function statusColor(value: unknown): string {
  const s = String(value || "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return STATUS_COLORS[s] || "bg-zinc-500/15 text-zinc-300 border-zinc-500/25";
}

// ── Props ─────────────────────────────────────────────────────────

interface SpreadsheetViewProps {
  artifact: Artifact;
  className?: string;
}

// ── Main Component ────────────────────────────────────────────────

export function SpreadsheetView({ artifact, className }: SpreadsheetViewProps) {
  // Handle non-data_table artifacts gracefully
  const isDataTable = artifact.type === "data_table";
  const columns: ColumnDef[] = isDataTable
    ? (artifact as DataTableArtifactType).columns
    : [];
  const rows: Record<string, unknown>[] = isDataTable
    ? (artifact as DataTableArtifactType).rows
    : [];
  const title = isDataTable ? (artifact as DataTableArtifactType).title : "Data";

  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((c) => c.key))
  );
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Search filter
  const searchedRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [rows, columns, searchQuery]);

  // Column filters
  const filteredRows = useMemo(() => {
    let result = searchedRows;
    for (const [colKey, filterVal] of Object.entries(filters)) {
      if (!filterVal.trim()) continue;
      const fv = filterVal.toLowerCase();
      result = result.filter((row) => {
        const val = row[colKey];
        return val != null && String(val).toLowerCase().includes(fv);
      });
    }
    return result;
  }, [searchedRows, filters]);

  // Sort
  const sortedRows = useMemo(() => {
    if (!sortKey || !sortDir) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      let cmp = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredRows, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedRows = sortedRows.slice(
    safePage * ROWS_PER_PAGE,
    (safePage + 1) * ROWS_PER_PAGE
  );

  const handleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
        return prev;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const toggleColumn = useCallback((key: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev; // keep at least 1 column
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleExportCSV = useCallback(() => {
    const visibleCols = columns.filter((c) => visibleColumns.has(c.key));
    const header = visibleCols.map((c) => c.label).join(",");
    const body = sortedRows
      .map((row) =>
        visibleCols
          .map((c) => {
            const val = row[c.key];
            const str = val == null ? "" : String(val);
            // Escape CSV
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(",")
      )
      .join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sortedRows, columns, visibleColumns, title]);

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey)
      return <ArrowUpDown className="size-3 text-zinc-600 opacity-50" />;
    if (sortDir === "asc") return <ArrowUp className="size-3 text-emerald-400" />;
    if (sortDir === "desc") return <ArrowDown className="size-3 text-emerald-400" />;
    return <ArrowUpDown className="size-3 text-zinc-600 opacity-50" />;
  };

  const renderCell = (value: unknown, col: ColumnDef): React.ReactNode => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-zinc-600">—</span>;
    }
    switch (col.type) {
      case "currency":
        return (
          <span className="tabular-nums font-mono text-xs">
            {formatCurrency(value)}
          </span>
        );
      case "number":
        return (
          <span className="tabular-nums font-mono text-xs">
            {formatNumber(value)}
          </span>
        );
      case "date":
        return <span className="text-zinc-400 text-xs">{formatDate(value)}</span>;
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
  };

  const visibleCols = columns.filter((c) => visibleColumns.has(c.key));

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04] bg-white/[0.01] flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[140px] max-w-[320px]">
          <Search className="size-3.5 text-zinc-500 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search all columns…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 outline-none border-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPage(0);
              }}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Row count */}
        <span className="text-[10px] text-zinc-600 font-mono tabular-nums">
          {sortedRows.length} of {rows.length} rows
        </span>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
            showFilters
              ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
          )}
        >
          <Filter className="size-3" />
          <span className="hidden sm:inline">Filter</span>
        </button>

        {/* Column picker */}
        <div className="relative">
          <button
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
              showColumnPicker
                ? "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
            )}
          >
            <Columns className="size-3" />
            <span className="hidden sm:inline">Columns</span>
          </button>
          <AnimatePresence>
            {showColumnPicker && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-white/[0.08] bg-zinc-900/95 backdrop-blur-xl shadow-xl z-30 p-1.5"
              >
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.04] cursor-pointer text-xs text-zinc-300"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(col.key)}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-white/20 bg-white/5 accent-emerald-500"
                    />
                    {col.label}
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Export */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-all"
        >
          <Download className="size-3" />
          <span className="hidden sm:inline">CSV</span>
        </button>
      </div>

      {/* Filter row */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/[0.04] bg-amber-500/[0.02]"
          >
            <div className="flex items-center gap-2 px-4 py-2 flex-wrap">
              {visibleCols.slice(0, 5).map((col) => (
                <div key={col.key} className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500">{col.label}:</span>
                  <input
                    type="text"
                    placeholder="Filter…"
                    value={filters[col.key] || ""}
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, [col.key]: e.target.value }));
                      setPage(0);
                    }}
                    className="w-24 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-0.5 text-[10px] text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/30"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10">
            <tr className="bg-zinc-950/90 backdrop-blur-md">
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={cn(
                    "px-3 py-2.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap border-b border-white/[0.06]",
                    col.sortable !== false &&
                      "cursor-pointer select-none hover:text-zinc-200 transition-colors"
                  )}
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
              {paginatedRows.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                >
                  {visibleCols.map((col) => (
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
        {paginatedRows.length === 0 && (
          <div className="flex items-center justify-center py-16 text-center">
            <div className="flex flex-col items-center gap-2">
              <SlidersHorizontal className="size-8 text-zinc-700" />
              <p className="text-xs text-zinc-500">
                {searchQuery || Object.values(filters).some(Boolean)
                  ? "No rows match your search or filters"
                  : "No data available"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.04] bg-white/[0.01] shrink-0">
          <span className="text-[10px] text-zinc-500">
            Page {safePage + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="px-2 py-1 rounded-md text-[10px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i;
              } else if (safePage < 4) {
                pageNum = i;
              } else if (safePage > totalPages - 5) {
                pageNum = totalPages - 7 + i;
              } else {
                pageNum = safePage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    "size-6 rounded-md text-[10px] font-medium transition-all",
                    pageNum === safePage
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                  )}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-2 py-1 rounded-md text-[10px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpreadsheetView;
