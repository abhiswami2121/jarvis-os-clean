"use client";

import { type CanvasData } from "@/lib/stores/canvas-store";

// ── Types ───────────────────────────────────────────────────────

interface DigestSection {
  heading: string;
  content: string;
  icon?: string;
  color?: string;
}

interface MetricCard {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  format?: "currency" | "number" | "percent";
}

interface ChartData {
  x: string;
  y: number;
}

// ── Render function ─────────────────────────────────────────────

export function weeklyDigest(data: CanvasData): string {
  const title = data.title ?? "Weekly Digest";
  const subtitle = (data.subtitle as string) ?? "";
  const sections = (data.sections as DigestSection[]) ?? [];
  const metrics = (data.metrics as MetricCard[]) ?? [];
  const charts = (data.charts as ChartData[]) ?? [];
  const dateRange = data.dateRange as { start: string; end: string } | undefined;

  let html = "";

  // ── Header ──
  html += `<div style="margin-bottom:20px">`;
  html += `<h1 class="aurora-text" style="font-size:22px;font-weight:700;margin-bottom:4px">${escapeHtml(title)}</h1>`;
  if (dateRange) {
    html += `<p style="color:var(--text-tertiary);font-size:12px;margin-bottom:2px">${escapeHtml(dateRange.start)} → ${escapeHtml(dateRange.end)}</p>`;
  } else if (subtitle) {
    html += `<p style="color:var(--text-tertiary);font-size:12px">${escapeHtml(subtitle)}</p>`;
  }
  html += `</div>`;

  // ── Metric Cards ──
  if (metrics.length > 0) {
    html += `<div class="metric-grid">`;
    for (const m of metrics) {
      const trendClass = m.trend === "up" ? "metric-trend-up" : m.trend === "down" ? "metric-trend-down" : "metric-trend-flat";
      const trendArrow = m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→";
      const formattedValue = formatMetricValue(m.value, m.format);
      html += `<div class="metric-card">
        <div class="metric-label">${escapeHtml(m.label)}</div>
        <div class="metric-value">${escapeHtml(formattedValue)}</div>
        ${m.trend ? `<div style="font-size:11px;margin-top:4px" class="${trendClass}">${trendArrow} ${m.trend}</div>` : ""}
      </div>`;
    }
    html += `</div>`;
  }

  // ── Mini Chart (simple CSS bar) ──
  if (charts.length > 0) {
    const maxY = Math.max(...charts.map((c) => c.y), 1);
    html += `<div class="glass-card"><h3 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px">📊 Trend</h3>`;
    html += `<div style="display:flex;align-items:flex-end;gap:4px;height:100px">`;
    for (const point of charts) {
      const height = Math.max(4, (point.y / maxY) * 100);
      html += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%">
        <div style="width:100%;height:${height}%;background:linear-gradient(to top,rgba(16,217,160,0.6),rgba(16,217,160,0.1));border-radius:4px 4px 0 0;min-height:4px" title="${escapeHtml(String(point.y))}"></div>
        <span style="font-size:9px;color:var(--text-tertiary);margin-top:4px">${escapeHtml(point.x)}</span>
      </div>`;
    }
    html += `</div></div>`;
  }

  // ── Sections ──
  for (const section of sections) {
    const accentColor = section.color ?? "rgba(16,185,129,0.4)";
    html += `<div class="section-block" style="border-left-color:${accentColor}">
      <div class="section-heading">${section.icon ? section.icon + " " : ""}${escapeHtml(section.heading)}</div>
      <div class="section-content">${escapeHtml(section.content)}</div>
    </div>`;
  }

  return html;
}

// ── Helpers ─────────────────────────────────────────────────────

function formatMetricValue(value: string | number, format?: string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(num);
  }
  if (format === "percent") return `${num}%`;
  return new Intl.NumberFormat("en-US").format(num);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
