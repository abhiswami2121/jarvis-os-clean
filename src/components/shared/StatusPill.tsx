"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Variant = "emerald" | "amber" | "rose" | "blue" | "purple" | "neutral";

interface StatusPillProps {
  variant?: Variant;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantMap: Record<Variant, { bg: string; text: string; ring: string; dot: string; shadow: string }> = {
  emerald: { bg: "bg-emerald-400/10", text: "text-emerald-300", ring: "ring-emerald-400/30", dot: "bg-emerald-400", shadow: "shadow-[0_0_12px_2px_rgba(16,217,160,0.5)]" },
  amber:   { bg: "bg-amber-400/10",   text: "text-amber-300",   ring: "ring-amber-400/30",   dot: "bg-amber-400",   shadow: "shadow-[0_0_12px_2px_rgba(251,191,36,0.5)]" },
  rose:    { bg: "bg-rose-400/10",    text: "text-rose-300",    ring: "ring-rose-400/30",    dot: "bg-rose-400",    shadow: "shadow-[0_0_12px_2px_rgba(244,63,94,0.5)]" },
  blue:    { bg: "bg-blue-400/10",    text: "text-blue-300",    ring: "ring-blue-400/30",    dot: "bg-blue-400",    shadow: "shadow-[0_0_12px_2px_rgba(79,139,255,0.5)]" },
  purple:  { bg: "bg-purple-400/10",  text: "text-purple-300",  ring: "ring-purple-400/30",  dot: "bg-purple-400",  shadow: "shadow-[0_0_12px_2px_rgba(168,85,247,0.5)]" },
  neutral: { bg: "bg-white/5",        text: "text-zinc-400",    ring: "ring-white/10",       dot: "bg-zinc-500",    shadow: "" },
};

export function StatusPill({ variant = "neutral", pulse = false, children, className }: StatusPillProps) {
  const v = variantMap[variant];
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1", v.bg, v.text, v.ring, className)}>
      {pulse ? (
        <motion.span
          animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={cn("size-1.5 rounded-full", v.dot, v.shadow)}
        />
      ) : (
        <span className={cn("size-1.5 rounded-full", v.dot)} />
      )}
      {children}
    </span>
  );
}
