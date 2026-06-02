"use client";

import { useState, useEffect, useCallback, type FC } from "react";
import { Command } from "cmdk";
import {
  Search,
  Play,
  XCircle,
  Rocket,
  Download,
  FileText,
  Code,
  Database,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ── Types ──────────────────────────────────────────────────────────

export interface PaletteAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  keywords?: string[];
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  actions?: PaletteAction[];
}

// ── Default actions ────────────────────────────────────────────────

const DEFAULT_ACTIONS: PaletteAction[] = [
  {
    id: "rerun-plan",
    label: "Re-run plan",
    icon: Play,
    shortcut: "⌘↵",
    keywords: ["rerun", "plan", "generate", "restart"],
    onSelect: () => {},
  },
  {
    id: "cancel",
    label: "Cancel generation",
    icon: XCircle,
    shortcut: "Esc",
    keywords: ["cancel", "stop", "abort"],
    onSelect: () => {},
  },
  {
    id: "deploy",
    label: "Deploy",
    icon: Rocket,
    shortcut: "⌘D",
    keywords: ["deploy", "ship", "publish", "vercel"],
    onSelect: () => {},
  },
  {
    id: "download",
    label: "Download artifact",
    icon: Download,
    shortcut: "⌘S",
    keywords: ["download", "save", "export", "zip"],
    onSelect: () => {},
  },
];

// ── Component ──────────────────────────────────────────────────────

export const CommandPalette: FC<CommandPaletteProps> = ({
  open,
  onClose,
  actions,
}) => {
  const allActions = actions?.length ? actions : DEFAULT_ACTIONS;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
          >
            <Command
              className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
              data-cmdk-palette="true"
            >
              {/* Search input */}
              <div className="flex items-center gap-2 px-4 border-b border-white/[0.04]">
                <Search className="size-4 shrink-0 text-zinc-500" />
                <Command.Input
                  placeholder="Type a command or search..."
                  className="flex-1 h-12 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
                  autoFocus
                />
              </div>

              {/* Results */}
              <Command.List className="max-h-64 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-xs text-zinc-500">
                  No results found.
                </Command.Empty>

                {allActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Command.Item
                      key={action.id}
                      value={action.id}
                      keywords={action.keywords}
                      onSelect={() => {
                        action.onSelect();
                        onClose();
                      }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/[0.06] data-[selected=true]:text-zinc-100 transition-colors"
                    >
                      {Icon && <Icon className="size-4 shrink-0 text-zinc-500" />}
                      <span className="flex-1">{action.label}</span>
                      {action.shortcut && (
                        <kbd className="text-[10px] font-mono text-zinc-600 bg-white/[0.03] rounded-md px-1.5 py-0.5">
                          {action.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  );
                })}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center gap-3 px-4 py-2 border-t border-white/[0.04] text-[10px] text-zinc-600">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
