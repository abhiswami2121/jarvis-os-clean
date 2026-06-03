"use client";
import { useState, useEffect } from "react";
import { RoutingModeCard } from "@/components/neptune/RoutingModeCard";
import { ApiKeyCard } from "@/components/neptune/ApiKeyCard";
import { toast } from "sonner";
import { Zap, Rocket, Key } from "lucide-react";

export default function SettingsPage() {
  const [routingMode, setRoutingMode] = useState<"direct" | "gateway">("gateway");
  const [loading, setLoading] = useState(true);
  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({});
  const [keyPreviews, setKeyPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/user/settings");
      const data = await res.json();
      if (data.routing_mode) setRoutingMode(data.routing_mode);
      if (data.key_status) setKeyStatus(data.key_status);
      if (data.key_previews) setKeyPreviews(data.key_previews);
    } catch (e) {
      // defaults are fine
    } finally {
      setLoading(false);
    }
  }

  async function setMode(mode: "direct" | "gateway") {
    setRoutingMode(mode);
    try {
      await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routing_mode: mode }),
      });
      toast.success(`Routing mode set to ${mode === "gateway" ? "AI Gateway" : "Direct"}`);
    } catch (e) {
      toast.error("Failed to save routing mode");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080f]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Neptune Settings</h1>
          <p className="text-sm text-zinc-400 mt-1">Configure AI routing and API keys</p>
        </div>

        {/* ── Routing Mode ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="size-4 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Routing Mode</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">How Neptune calls AI models</p>

          <div className="grid grid-cols-2 gap-4">
            <RoutingModeCard
              mode="gateway"
              icon="🚀"
              title="Vercel AI Gateway"
              subtitle="RECOMMENDED"
              description="One key. 100+ models. Auto-failover. Same pricing as direct."
              selected={routingMode === "gateway"}
              onClick={() => setMode("gateway")}
            />
            <RoutingModeCard
              mode="direct"
              icon="⚡"
              title="Direct"
              description="Provider keys. Max performance. Slightly faster."
              selected={routingMode === "direct"}
              onClick={() => setMode("direct")}
            />
          </div>
        </section>

        {/* ── API Keys ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Key className="size-4 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">API Keys</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            {routingMode === "gateway"
              ? "AI Gateway key is PRIMARY. Others are optional fallbacks."
              : "Provider keys for direct routing. AI Gateway key is optional."}
          </p>

          <div className="space-y-3">
            <ApiKeyCard
              name="AI Gateway"
              envKey="AI_GATEWAY_API_KEY"
              icon="🚀"
              description="Vercel AI Gateway — 100+ models, one key"
              preview={keyPreviews.ai_gateway_key}
              active={keyStatus.has_ai_gateway_key}
              primary={routingMode === "gateway"}
            />
            <ApiKeyCard
              name="Anthropic"
              envKey="ANTHROPIC_API_KEY"
              icon="🔵"
              description="Claude models (Opus, Sonnet, Haiku)"
              preview={keyPreviews.anthropic_key}
              active={keyStatus.has_anthropic_key}
              primary={routingMode === "direct"}
            />
            <ApiKeyCard
              name="DeepSeek"
              envKey="DEEPSEEK_API_KEY"
              icon="🌊"
              description="DeepSeek V4 Pro / Flash / Reasoner"
              preview={keyPreviews.deepseek_key}
              active={keyStatus.has_deepseek_key}
              primary={routingMode === "direct"}
              fallbackNote={!keyStatus.has_deepseek_key && keyStatus.has_anthropic_key
                ? "Falls back to Anthropic key for DeepSeek models"
                : undefined}
            />
            <ApiKeyCard
              name="OpenAI"
              envKey="OPENAI_API_KEY"
              icon="🟢"
              description="GPT-5.5, GPT-5 Mini, o3-mini"
              preview={keyPreviews.openai_key}
              active={keyStatus.has_openai_key}
            />
            <ApiKeyCard
              name="Gemini"
              envKey="GEMINI_API_KEY"
              icon="💫"
              description="Gemini 3 Ultra / Pro / Flash"
              preview={keyPreviews.gemini_key}
              active={keyStatus.has_gemini_key}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
