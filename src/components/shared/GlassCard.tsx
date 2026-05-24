"use client";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  glow?: "aurora" | "emerald" | "blue" | "amber" | "rose" | "none";
  hover?: boolean;
  children: React.ReactNode;
  className?: string;
}

const glowMap = {
  aurora: "hover:shadow-[0_20px_60px_-20px_rgba(168,85,247,0.4)]",
  emerald: "hover:shadow-[0_20px_60px_-20px_rgba(16,217,160,0.4)]",
  blue: "hover:shadow-[0_20px_60px_-20px_rgba(79,139,255,0.4)]",
  amber: "hover:shadow-[0_20px_60px_-20px_rgba(251,191,36,0.4)]",
  rose: "hover:shadow-[0_20px_60px_-20px_rgba(244,63,94,0.4)]",
  none: "",
};

export function GlassCard({ glow = "aurora", hover = true, className, children, ...rest }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn("glass-card rounded-2xl transition-shadow duration-300", glowMap[glow], className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
