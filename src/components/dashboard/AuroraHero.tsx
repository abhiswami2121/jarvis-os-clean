"use client";
import { motion } from "motion/react";

export function AuroraHero() {
  return (
    <section className="relative overflow-hidden py-20 text-center">
      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 -z-10 aurora-bg blur-3xl"
        style={{ background: "radial-gradient(ellipse at center, rgba(168,85,247,0.25), rgba(79,139,255,0.15), transparent 70%)" }}
      />
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl aurora-text"
      >
        What do you want to do?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mx-auto mt-4 max-w-xl text-base text-zinc-400"
      >
        Plan, execute, audit, dispatch. Jarvis has full access to NewLeaf and runs in parallel.
      </motion.p>
    </section>
  );
}
