"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

// ── Props ───────────────────────────────────────────────────────

interface CanvasFrameProps {
  html: string;
  title?: string;
  className?: string;
  onLoad?: () => void;
}

// ── Component ───────────────────────────────────────────────────

/**
 * Sandboxed iframe for rendering canvas HTML content.
 * Strict sandbox: scripts + same-origin only. No top-navigation, no forms, no popups.
 */
export function CanvasFrame({ html, title = "Canvas", className, onLoad }: CanvasFrameProps) {
  const srcdoc = useMemo(() => {
    // Embed the standard canvas styles + the generated HTML
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg-base: #08080f;
      --bg-elevated: #12121b;
      --aurora-blue: #4F8BFF;
      --aurora-purple: #A855F7;
      --aurora-pink: #EC4899;
      --aurora-amber: #FBBF24;
      --aurora-emerald: #10D9A0;
      --aurora-cyan: #06D9F0;
      --text-primary: #FAFAFA;
      --text-secondary: #A1A1AA;
      --text-tertiary: #71717A;
      --glass-border: rgba(255,255,255,0.06);
      --glass-border-strong: rgba(255,255,255,0.1);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter Display', 'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif;
      background: var(--bg-base);
      color: var(--text-primary);
      padding: 24px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.08);
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

    /* ── Glass card ── */
    .glass-card {
      background: linear-gradient(135deg, rgba(255,255,255,0.04), transparent);
      backdrop-filter: blur(24px) saturate(150%);
      -webkit-backdrop-filter: blur(24px) saturate(150%);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
    }
    /* ── Aurora gradient text ── */
    .aurora-text {
      background: linear-gradient(135deg, var(--aurora-blue) 0%, var(--aurora-purple) 35%, var(--aurora-pink) 70%, var(--aurora-amber) 100%);
      background-size: 200% 200%;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: aurora-shift 8s ease infinite;
    }
    @keyframes aurora-shift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    /* ── Metric cards ── */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin: 16px 0;
    }
    .metric-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 12px;
      padding: 16px;
    }
    .metric-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }
    .metric-trend-up { color: var(--aurora-emerald); }
    .metric-trend-down { color: #F43F5E; }
    .metric-trend-flat { color: var(--text-tertiary); }
    /* ── Section blocks ── */
    .section-block {
      border-left: 2px solid rgba(16, 185, 129, 0.4);
      padding-left: 16px;
      margin: 12px 0;
    }
    .section-heading {
      font-size: 14px;
      font-weight: 600;
      color: var(--aurora-emerald);
      margin-bottom: 6px;
    }
    .section-content {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.7;
    }
    /* ── Tables ── */
    .data-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 13px;
    }
    .data-table th {
      background: rgba(255,255,255,0.03);
      padding: 10px 14px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
      border-bottom: 1px solid var(--glass-border-strong);
      cursor: pointer;
      user-select: none;
    }
    .data-table th:hover { color: var(--text-secondary); }
    .data-table td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--glass-border);
      color: var(--text-primary);
    }
    .data-table tr:hover td { background: rgba(255,255,255,0.02); }
    .sort-asc::after { content: " ▲"; font-size: 9px; }
    .sort-desc::after { content: " ▼"; font-size: 9px; }
    /* ── Buttons ── */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary { background: var(--aurora-emerald); color: #08080f; }
    .btn-primary:hover { filter: brightness(1.1); }
    .btn-secondary { background: rgba(255,255,255,0.06); color: var(--text-secondary); border: 1px solid var(--glass-border); }
    .btn-secondary:hover { background: rgba(255,255,255,0.1); }
    /* ── Status pills ── */
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-healthy { background: rgba(16, 217, 160, 0.12); color: var(--aurora-emerald); }
    .status-attention { background: rgba(251, 191, 36, 0.12); color: var(--aurora-amber); }
    .status-critical { background: rgba(244, 63, 94, 0.12); color: #F43F5E; }
    .status-neutral { background: rgba(255,255,255,0.06); color: var(--text-tertiary); }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
  }, [html, title]);

  return (
    <iframe
      title={title}
      srcDoc={srcdoc}
      sandbox="allow-scripts allow-same-origin"
      className={cn(
        "w-full h-full border-0 rounded-xl",
        "bg-[#08080f]",
        className,
      )}
      onLoad={onLoad}
    />
  );
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
