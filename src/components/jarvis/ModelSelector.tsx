"use client";

import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Zap, ChevronDown } from "lucide-react";

// ─── Model definitions ────────────────────────────────────────────────

const LS_MODEL_KEY = "jarvis-os:model:v1";

interface ModelOption {
  id: string;
  label: string;
  desc: string;
  icon: typeof Sparkles;
}

const MODELS: ModelOption[] = [
  { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro", desc: "Default · Reasoning", icon: Sparkles },
  { id: "kimi-k2.6", label: "Kimi K2.6", desc: "Fast · 1M context", icon: Zap },
];

const DEFAULT_MODEL = "deepseek-v4-pro";

// ─── Context ──────────────────────────────────────────────────────────

interface ModelContextValue {
  selectedModel: string;
  setSelectedModel: (id: string) => void;
}

const ModelContext = createContext<ModelContextValue>({
  selectedModel: DEFAULT_MODEL,
  setSelectedModel: () => {},
});

export function useSelectedModel() {
  const { selectedModel } = useContext(ModelContext);
  return selectedModel;
}

// ─── Component ────────────────────────────────────────────────────────

export function ModelSelector() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(DEFAULT_MODEL);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LS_MODEL_KEY);
      if (saved) setSelected(saved);
    }
  }, []);

  // Persist on change
  const selectModel = useCallback((id: string) => {
    setSelected(id);
    setOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_MODEL_KEY, id);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const active = MODELS.find((m) => m.id === selected) || MODELS[0];
  const Icon = active.icon;

  return (
    <ModelContext.Provider
      value={{ selectedModel: selected, setSelectedModel: selectModel }}
    >
      <div ref={containerRef} className="relative">
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.04] backdrop-blur-xl px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <Icon className="size-3 text-emerald-400" />
          <span className="truncate max-w-[100px]">{active.label}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="size-3 text-zinc-500" />
          </motion.span>
        </button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute left-0 top-full mt-1.5 z-50 w-56 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0f0f17]/95 backdrop-blur-xl shadow-lg shadow-black/40"
              role="listbox"
            >
              <div className="p-1">
                {MODELS.map((model) => {
                  const MIcon = model.icon;
                  const isActive = selected === model.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => selectModel(model.id)}
                      className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-all ${
                        isActive
                          ? "bg-white/[0.06] ring-1 ring-emerald-500/30"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <MIcon
                        className={`size-4 mt-0.5 ${
                          isActive ? "text-emerald-400" : "text-zinc-500"
                        }`}
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-zinc-200">
                          {model.label}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {model.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModelContext.Provider>
  );
}
