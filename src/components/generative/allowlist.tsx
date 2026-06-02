"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// ── Glass design tokens ────────────────────────────────────────────

const glassBase =
  "bg-zinc-950/80 backdrop-blur-xl border border-white/[0.04] shadow-[0_4px_24px_-12px_rgba(0,0,0,0.3)]";
const glassHover = "hover:border-white/[0.08] hover:bg-zinc-900/80 transition-colors";
const accentColor = "text-emerald-400";
const accentBg = "bg-emerald-400/10";
const textPrimary = "text-zinc-100";
const textSecondary = "text-zinc-400";
const textMuted = "text-zinc-500";
const fontMono = "font-mono";

// ── Card ───────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5",
        glassBase,
        onClick && `cursor-pointer ${glassHover}`,
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ── Button ─────────────────────────────────────────────────────────

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function GlassButton({
  children,
  variant = "secondary",
  size = "md",
  onClick,
  disabled,
  className,
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary:
      "bg-emerald-400/90 text-black hover:bg-emerald-400 border-emerald-400/20",
    secondary: cn(glassBase, glassHover, textSecondary),
    ghost: "bg-transparent hover:bg-white/[0.04] text-zinc-400",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-xl",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 font-medium border transition-colors",
        variants[variant],
        sizes[size],
        disabled && "opacity-40 pointer-events-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

// ── Stat ───────────────────────────────────────────────────────────

interface StatProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function GlassStat({ label, value, trend, trendValue, className }: StatProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className={cn("text-[11px] uppercase tracking-wider", textMuted)}>
        {label}
      </span>
      <span className={cn("text-3xl font-semibold tracking-tight", textPrimary)}>
        {value}
      </span>
      {trend && trendValue && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs",
            trend === "up"
              ? "text-emerald-400"
              : trend === "down"
                ? "text-red-400"
                : textMuted,
          )}
        >
          {TrendIcon && <TrendIcon className="size-3" />}
          {trendValue}
        </span>
      )}
    </div>
  );
}

// ── Table ──────────────────────────────────────────────────────────

interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
}

interface TableProps {
  columns: TableColumn[];
  rows: Record<string, React.ReactNode>[];
  className?: string;
}

export function GlassTable({ columns, rows, className }: TableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-white/[0.04]", className)}>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.04] bg-white/[0.02]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-2.5 text-xs font-medium uppercase tracking-wider",
                  textSecondary,
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right",
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={cn(
                "border-t border-white/[0.02]",
                i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]",
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-2 text-zinc-300",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                  )}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Code ───────────────────────────────────────────────────────────

interface CodeProps {
  children: string;
  language?: string;
  className?: string;
}

export function GlassCode({ children, language, className }: CodeProps) {
  return (
    <div className={cn("rounded-xl overflow-hidden border border-white/[0.04]", className)}>
      {language && (
        <div className="flex items-center px-4 py-1.5 border-b border-white/[0.04] bg-white/[0.02]">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {language}
          </span>
        </div>
      )}
      <pre className="p-4 overflow-x-auto bg-zinc-950/60">
        <code
          className={cn("text-sm text-zinc-300 leading-relaxed", fontMono)}
        >
          {children}
        </code>
      </pre>
    </div>
  );
}

// ── Callout ────────────────────────────────────────────────────────

type CalloutVariant = "info" | "warn" | "error" | "success";

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const calloutStyles: Record<CalloutVariant, { border: string; bg: string; icon: React.ComponentType<{ className?: string }>; iconColor: string }> = {
  info: {
    border: "border-sky-500/20",
    bg: "bg-sky-500/[0.04]",
    icon: Info,
    iconColor: "text-sky-400",
  },
  warn: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/[0.04]",
    icon: AlertTriangle,
    iconColor: "text-amber-400",
  },
  error: {
    border: "border-red-500/20",
    bg: "bg-red-500/[0.04]",
    icon: XCircle,
    iconColor: "text-red-400",
  },
  success: {
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/[0.04]",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
  },
};

export function GlassCallout({
  variant = "info",
  title,
  children,
  className,
}: CalloutProps) {
  const style = calloutStyles[variant];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        style.border,
        style.bg,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("size-4 shrink-0 mt-0.5", style.iconColor)} />
        <div>
          {title && (
            <h4 className={cn("text-sm font-semibold mb-1", textPrimary)}>
              {title}
            </h4>
          )}
          <div className="text-sm text-zinc-300 leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ── Chart (placeholder — recharts integration point) ───────────────

interface ChartProps {
  title?: string;
  type?: "bar" | "line" | "pie";
  className?: string;
}

export function GlassChart({ title, type = "bar", className }: ChartProps) {
  return (
    <div className={cn(glassBase, "rounded-2xl p-5", className)}>
      {title && (
        <h3 className={cn("text-sm font-semibold mb-4", textPrimary)}>{title}</h3>
      )}
      <div className="flex items-center justify-center h-48 rounded-xl border border-white/[0.04] bg-white/[0.02]">
        <div className="flex flex-col items-center gap-2">
          <div className={cn("size-10 rounded-full flex items-center justify-center", accentBg)}>
            <TrendingUp className={cn("size-5", accentColor)} />
          </div>
          <span className="text-xs text-zinc-500">
            {type === "bar" ? "Bar" : type === "line" ? "Line" : "Pie"} chart
          </span>
          <span className="text-[10px] text-zinc-600">Recharts integration</span>
        </div>
      </div>
    </div>
  );
}

// ── Allowlist export ───────────────────────────────────────────────

/** Components available in the generative UI allowlist */
export const GENERATIVE_COMPONENTS = {
  Card: GlassCard,
  Button: GlassButton,
  Stat: GlassStat,
  Table: GlassTable,
  Code: GlassCode,
  Callout: GlassCallout,
  Chart: GlassChart,
} as const;

export type GenerativeComponentName = keyof typeof GENERATIVE_COMPONENTS;

export default GENERATIVE_COMPONENTS;
