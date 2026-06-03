"use client";
import { cn } from "@/lib/utils";

interface Props {
  mode: "direct" | "gateway";
  icon: string;
  title: string;
  subtitle?: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export function RoutingModeCard({ mode, icon, title, subtitle, description, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative text-left rounded-xl border p-4 transition-all duration-200",
        selected
          ? "border-emerald-500/40 bg-emerald-500/8 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/20 hover:bg-white/[0.04]"
      )}
    >
      {subtitle && (
        <span className={cn(
          "absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full",
          selected ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-500"
        )}>
          {subtitle}
        </span>
      )}
      <div className="text-2xl mb-2">{icon}</div>
      <div className={cn("font-semibold text-sm", selected ? "text-white" : "text-zinc-300")}>
        {title}
      </div>
      <div className="text-xs text-zinc-500 mt-1 leading-relaxed">{description}</div>

      {selected && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-medium text-emerald-400">ACTIVE</span>
        </div>
      )}
    </button>
  );
}
