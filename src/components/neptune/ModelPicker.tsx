"use client";
import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { GATEWAY_MODELS, DIRECT_MODELS } from "@/lib/neptune/routing-resolver";

interface Props {
  routingMode: "direct" | "gateway";
  value: string;
  onChange: (model: string) => void;
  availableKeys: string[]; // list of env key names that are configured
}

export function ModelPicker({ routingMode, value, onChange, availableKeys }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const models = useMemo(() => {
    if (routingMode === "gateway") {
      return GATEWAY_MODELS;
    }
    // Direct mode: only show models for which user has keys
    return DIRECT_MODELS.filter(m => availableKeys.includes(m.requiresKey));
  }, [routingMode, availableKeys]);

  const filtered = useMemo(() => {
    if (!query) return models;
    const q = query.toLowerCase();
    return models.filter(m =>
      m.label.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      m.value.toLowerCase().includes(q)
    );
  }, [models, query]);

  const selected = models.find(m => m.value === value);
  const grouped = useMemo(() => {
    const groups: Record<string, typeof models> = {};
    for (const m of filtered) {
      if (!groups[m.provider]) groups[m.provider] = [];
      groups[m.provider].push(m);
    }
    return groups;
  }, [filtered]);

  const providerLabels: Record<string, string> = {
    deepseek: "🌊 DeepSeek",
    anthropic: "🔵 Anthropic",
    openai: "🟢 OpenAI",
    google: "💫 Google Gemini",
    xai: "⚫ xAI Grok",
    meta: "🦙 Meta Llama",
    mistral: "✨ Mistral",
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-zinc-200 hover:border-emerald-500/30 transition-all"
      >
        <span className="text-base">{selected?.icon || "🤖"}</span>
        <span className="flex-1 text-left">{selected?.label || "Select model..."}</span>
        <ChevronsUpDown className="size-4 text-zinc-600" />
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

      {/* Dropdown */}
      <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-white/[0.08] bg-[#0f0f1a] shadow-2xl overflow-hidden">
        {/* Search */}
        <div className="border-b border-white/[0.05] p-2">
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
            <Search className="size-3.5 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models..."
              className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Model list */}
        <div className="max-h-80 overflow-y-auto p-1">
          {Object.entries(grouped).map(([provider, providerModels]) => (
            <div key={provider}>
              <div className="px-2.5 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                {providerLabels[provider] || provider}
              </div>
              {providerModels.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    onChange(m.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-all",
                    value === m.value
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  )}
                >
                  <span className="text-sm">{m.icon}</span>
                  <span className="flex-1 text-left">{m.label}</span>
                  {value === m.value && <Check className="size-3.5 text-emerald-400 shrink-0" />}
                </button>
              ))}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="px-2.5 py-4 text-xs text-center text-zinc-600">
              {routingMode === "direct"
                ? "No models available for your configured keys."
                : "No models match your search."}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.05] px-2.5 py-1.5 text-[10px] text-zinc-600">
          {routingMode === "gateway"
            ? `${GATEWAY_MODELS.length} models via AI Gateway`
            : `${models.length} models available with your keys`}
        </div>
      </div>
    </div>
  );
}
