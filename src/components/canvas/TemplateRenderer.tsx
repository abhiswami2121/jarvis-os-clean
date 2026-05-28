"use client";

import { type TemplateType, type CanvasData } from "@/lib/stores/canvas-store";
import { weeklyDigest } from "@/components/canvas/templates/weekly-digest";
import { dataExplorer } from "@/components/canvas/templates/data-explorer";

// ── Props ───────────────────────────────────────────────────────

interface TemplateRendererProps {
  template: TemplateType;
  data: CanvasData;
}

// ── Built-in template registry ──────────────────────────────────

const templates: Partial<Record<TemplateType, (data: CanvasData) => string>> = {
  "weekly-digest": weeklyDigest,
  "data-explorer": dataExplorer,
  // Phase 2 templates (stubs)
  "billing-summary": (d) => `<div class="glass-card"><h2>${escapeHtml(d.title ?? "Billing Summary")}</h2><p class="section-content">Coming in Phase 2.</p></div>`,
  "customer-360": (d) => `<div class="glass-card"><h2>${escapeHtml(d.title ?? "Customer 360")}</h2><p class="section-content">Coming in Phase 2.</p></div>`,
  "planning-board": (d) => `<div class="glass-card"><h2>${escapeHtml(d.title ?? "Planning Board")}</h2><p class="section-content">Coming in Phase 2.</p></div>`,
  "mission-report": (d) => `<div class="glass-card"><h2>${escapeHtml(d.title ?? "Mission Report")}</h2><p class="section-content">Coming in Phase 2.</p></div>`,
  "generic": (d) => renderGeneric(d),
};

// ── Component ───────────────────────────────────────────────────

/**
 * Routes canvas data to the correct HTML template.
 * Returns an HTML string to be rendered inside CanvasFrame.
 */
export function TemplateRenderer({ template, data }: TemplateRendererProps): string {
  const renderFn = templates[template];
  if (!renderFn) {
    return `<div class="glass-card">
      <h2 style="color:var(--aurora-emerald)">Unknown Template</h2>
      <p class="section-content">No renderer found for template type: <code>${escapeHtml(template)}</code></p>
    </div>`;
  }
  try {
    return renderFn(data);
  } catch (err) {
    return `<div class="glass-card" style="border-color:rgba(244,63,94,0.3)">
      <h2 style="color:#F43F5E">Render Error</h2>
      <p class="section-content">${escapeHtml(String(err))}</p>
    </div>`;
  }
}

// ── Generic fallback ────────────────────────────────────────────

function renderGeneric(data: CanvasData): string {
  const title = data.title ?? "Data View";
  let html = `<h1 class="aurora-text" style="font-size:20px;font-weight:700;margin-bottom:8px">${escapeHtml(title)}</h1>`;
  if (data.subtitle) {
    html += `<p style="color:var(--text-tertiary);font-size:13px;margin-bottom:16px">${escapeHtml(String(data.subtitle))}</p>`;
  }
  html += `<div class="glass-card"><pre style="font-size:12px;color:var(--text-secondary);white-space:pre-wrap">${escapeHtml(JSON.stringify(data, null, 2))}</pre></div>`;
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
