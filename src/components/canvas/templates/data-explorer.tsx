"use client";

import { type CanvasData } from "@/lib/stores/canvas-store";

// ── Types ───────────────────────────────────────────────────────

interface DataColumn {
  key: string;
  label: string;
  type?: "string" | "number" | "currency" | "date" | "status";
  sortable?: boolean;
  width?: string;
}

interface DataRow {
  [key: string]: unknown;
}

// ── Render function ─────────────────────────────────────────────

export function dataExplorer(data: CanvasData): string {
  const title = data.title ?? "Data Explorer";
  const subtitle = (data.subtitle as string) ?? "";
  const columns = (data.columns as DataColumn[]) ?? [];
  const rows = (data.rows as DataRow[]) ?? [];

  // ── Generate unique ID for this table ──
  const tableId = `de-${Date.now()}`;

  let html = "";

  // ── Header ──
  html += `<div style="margin-bottom:20px">`;
  html += `<h1 class="aurora-text" style="font-size:20px;font-weight:700;margin-bottom:4px">${escapeHtml(title)}</h1>`;
  if (subtitle) {
    html += `<p style="color:var(--text-tertiary);font-size:12px">${escapeHtml(subtitle)}</p>`;
  }
  html += `</div>`;

  // ── Controls bar ──
  html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
    <div style="position:relative;flex:1;min-width:180px;max-width:320px">
      <input type="text" id="${tableId}-search" placeholder="Search…"
        oninput="window['${tableId}_filter']()"
        style="width:100%;padding:8px 12px 8px 32px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;color:var(--text-primary);font-size:12px;outline:none" />
      <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--text-tertiary)">🔍</span>
    </div>
    <span style="font-size:11px;color:var(--text-tertiary)">${rows.length} rows</span>
    <button class="btn btn-secondary" onclick="window['${tableId}_export']()">📥 CSV</button>
  </div>`;

  // ── Table ──
  html += `<div style="overflow-x:auto;border-radius:12px;border:1px solid var(--glass-border)">
    <table class="data-table" id="${tableId}">
      <thead><tr>`;
  for (const col of columns) {
    html += `<th onclick="window['${tableId}_sort']('${escapeHtml(col.key)}')"
      style="${col.width ? `width:${col.width};` : ""}"
      data-key="${escapeHtml(col.key)}">${escapeHtml(col.label)}</th>`;
  }
  html += `</tr></thead><tbody>`;

  // Store full dataset in a hidden element for JS access
  html += `</tbody></table></div>`;

  // ── Hidden data store ──
  html += `<script id="${tableId}-data" type="application/json">${JSON.stringify({ columns, rows })}</script>`;

  // ── Inline JavaScript for sorting, filtering, CSV export ──
  html += `<script>
(function() {
  const tableId = ${JSON.stringify(tableId)};
  const dataEl = document.getElementById(tableId + '-data');
  const table = document.getElementById(tableId);
  const tbody = table.querySelector('tbody');
  const searchInput = document.getElementById(tableId + '-search');

  let rawData = JSON.parse(dataEl.textContent);
  let columns = rawData.columns;
  let rows = [...rawData.rows];
  let sortKey = null;
  let sortDir = 'asc';

  function renderRows(r) {
    tbody.innerHTML = '';
    if (r.length === 0) {
      tbody.innerHTML = '<tr><td colspan="' + columns.length + '" style="text-align:center;padding:24px;color:var(--text-tertiary)">No matching rows</td></tr>';
      return;
    }
    for (const row of r) {
      let tr = '<tr>';
      for (const col of columns) {
        const val = row[col.key];
        const display = formatCell(val, col.type);
        tr += '<td>' + display + '</td>';
      }
      tr += '</tr>';
      tbody.innerHTML += tr;
    }
  }

  function formatCell(val, type) {
    if (val === null || val === undefined) return '<span style="color:var(--text-tertiary)">—</span>';
    if (type === 'currency' && typeof val === 'number') {
      return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (type === 'date' && typeof val === 'string') {
      try { return new Date(val).toLocaleDateString('en-US'); } catch(e) { return val; }
    }
    if (type === 'status') {
      const s = String(val).toLowerCase();
      const cls = s.includes('healthy') || s.includes('active') || s.includes('complete') ? 'status-healthy' :
                  s.includes('attention') || s.includes('pending') ? 'status-attention' :
                  s.includes('critical') || s.includes('error') || s.includes('failed') ? 'status-critical' : 'status-neutral';
      return '<span class="status-pill ' + cls + '">' + escapeHtml(String(val)) + '</span>';
    }
    return escapeHtml(String(val));
  }

  function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Sort function
  window[tableId + '_sort'] = function(key) {
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDir = 'asc';
    }
    const col = columns.find(c => c.key === key);
    rows.sort(function(a, b) {
      let va = a[key], vb = b[key];
      if (va == null) return 1; if (vb == null) return -1;
      if (col && (col.type === 'number' || col.type === 'currency')) {
        va = Number(va); vb = Number(vb);
      }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    // Update header indicators
    table.querySelectorAll('th').forEach(function(th) {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.key === key) th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    });
    renderRows(rows);
  };

  // Filter function
  window[tableId + '_filter'] = function() {
    const q = (searchInput.value || '').toLowerCase();
    if (!q) { renderRows(rows); return; }
    const filtered = rows.filter(function(row) {
      return columns.some(function(col) {
        const v = row[col.key];
        return v != null && String(v).toLowerCase().includes(q);
      });
    });
    renderRows(filtered);
  };

  // CSV export
  window[tableId + '_export'] = function() {
    const header = columns.map(function(c) { return '"' + c.label + '"'; }).join(',');
    const csvRows = rows.map(function(row) {
      return columns.map(function(c) {
        const v = row[c.key];
        if (v == null) return '';
        return '"' + String(v).replace(/"/g, '""') + '"';
      }).join(',');
    });
    const csv = header + '\\n' + csvRows.join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'data-export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Initial render
  renderRows(rows);
})();
</script>`;

  return html;
}

// ── Helpers ─────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
