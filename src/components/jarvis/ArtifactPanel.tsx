"use client";
import { X, Copy, Download, FileText, Code, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function ArtifactPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 480, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 480, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="relative z-20 flex w-[480px] flex-col border-l border-white/[0.06] bg-white/[0.02] backdrop-blur-xl"
        >
          <div className="flex h-14 items-center justify-between px-4 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-purple-400" />
              <span className="text-sm font-semibold">Artifacts</span>
              <span className="text-[10px] text-zinc-500">·  0 items</span>
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"><X className="size-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col items-center justify-center text-center py-16">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center mb-3">
                <Code className="size-5 text-purple-400" />
              </div>
              <div className="text-sm font-medium text-zinc-200">No artifacts yet</div>
              <div className="text-xs text-zinc-500 mt-1 max-w-[280px]">Code, documents, and reports Jarvis creates will appear here for review and download.</div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
