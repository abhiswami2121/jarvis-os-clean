"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download } from "lucide-react";

export interface DataColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableRendererProps {
  columns: DataColumn[];
  rows: Record<string, unknown>[];
  totalRows?: number;
  pageSize?: number;
}

type SortDir = "asc" | "desc" | null;

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCellValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function DataTableRenderer({
  columns,
  rows,
  totalRows,
  pageSize = 50,
}: DataTableRendererProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);

  const total = totalRows || rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageFrom = page * pageSize;

  // Sorted rows (declared BEFORE exportCSV which references it)
  const sortedRows = useMemo(() => {
    if (!sortKey || !sortDir) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDir === "asc" ? -1 : 1;
      if (bVal == null) return sortDir === "asc" ? 1 : -1;

      let cmp = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  // CSV export (references sortedRows which is now declared above)
  const exportCSV = useCallback(() => {
    const headers = columns.map((c) => escapeCSV(c.label)).join(",");
    const body = sortedRows
      .map((row) =>
        columns
          .map((c) => escapeCSV(formatCellValue(row[c.key])))
          .join(",")
      )
      .join("\n");
    const blob = new Blob([headers + "\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [columns, sortedRows]);

  const paginatedRows = useMemo(
    () => sortedRows.slice(pageFrom, pageFrom + pageSize),
    [sortedRows, pageFrom, pageSize]
  );

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else if (sortDir === "desc") {
        setSortKey(null);
        setSortDir(null);
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-zinc-500">No data to display</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header with CSV export */}
      <div className="flex items-center justify-end px-4 py-2 border-b border-white/[0.04]">
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 transition-colors"
          title="Export as CSV"
        >
          <Download className="size-3" />
          CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider ${
                    col.sortable !== false ? "cursor-pointer select-none hover:text-zinc-200 transition-colors" : ""
                  }`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && sortDir === "asc" && (
                      <ChevronUp className="size-3 text-emerald-400" />
                    )}
                    {sortKey === col.key && sortDir === "desc" && (
                      <ChevronDown className="size-3 text-emerald-400" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5 text-zinc-300 whitespace-nowrap">
                    <span className="font-mono text-[13px]">
                      {formatCellValue(row[col.key])}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-3">
          <span className="text-xs text-zinc-500">
            {pageFrom + 1}–{Math.min(pageFrom + pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="flex size-7 items-center justify-center rounded-md bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i;
              } else if (page < 4) {
                pageNum = i;
              } else if (page > totalPages - 5) {
                pageNum = totalPages - 7 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`flex size-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                    pageNum === page
                      ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="flex size-7 items-center justify-center rounded-md bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
