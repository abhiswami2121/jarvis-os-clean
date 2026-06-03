/**
 * NEPTUNE-7: Smart Routing Resolver
 *
 * Resolves a model selection to the correct API key, base URL,
 * and canonical model name based on the user's routing mode.
 *
 * CARDINAL RULES:
 * 1. GATEWAY mode → AI_GATEWAY_API_KEY + ai-gateway.vercel.sh
 * 2. DIRECT mode → per-provider routing with intuitive fallback
 * 3. INTUITIVE FALLBACK: if DEEPSEEK_API_KEY missing, fall back to ANTHROPIC_API_KEY (users often put DeepSeek key there)
 * 4. NEVER hardcode keys — always resolve from env at request time
 */

export interface ResolvedRoute {
  base_url: string;
  api_key: string;
  model: string;          // Final canonical model name
  provider: string;       // Which actual provider
  key_prefix: string;     // Masked key prefix for lifecycle display
  routing_mode: "direct" | "gateway";
}

interface UserKeySet {
  AI_GATEWAY_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

/**
 * Resolve routing for a given model selection and routing mode.
 * Used by the task creation endpoint to append routing metadata.
 */
export async function resolveRoute(
  selectedModel: string,
  routingMode: "direct" | "gateway" = "gateway"
): Promise<ResolvedRoute> {
  const keys = readAllKeys();

  // ── GATEWAY MODE ──────────────────────────────────────────────────
  if (routingMode === "gateway") {
    if (!keys.AI_GATEWAY_API_KEY) {
      throw new Error("AI Gateway key not configured. Add it in Settings → API Keys.");
    }
    return {
      base_url: "https://ai-gateway.vercel.sh",
      api_key: keys.AI_GATEWAY_API_KEY,
      model: normalizeToGatewayFormat(selectedModel),
      provider: extractProvider(selectedModel),
      key_prefix: maskKey(keys.AI_GATEWAY_API_KEY),
      routing_mode: "gateway",
    };
  }

  // ── DIRECT MODE ───────────────────────────────────────────────────
  const providerInfo = inferProviderFromModel(selectedModel);

  switch (providerInfo.provider) {
    case "deepseek": {
      // INTUITIVE FALLBACK: check ANTHROPIC slot if no dedicated DeepSeek key
      const key = keys.DEEPSEEK_API_KEY || keys.ANTHROPIC_API_KEY;
      if (!key) {
        throw new Error(
          "DeepSeek key not configured. Add DEEPSEEK_API_KEY (or ANTHROPIC_API_KEY) in Settings."
        );
      }
      return {
        base_url: "https://api.deepseek.com/anthropic",
        api_key: key,
        model: selectedModel,
        provider: "deepseek",
        key_prefix: maskKey(key),
        routing_mode: "direct",
      };
    }
    case "anthropic": {
      if (!keys.ANTHROPIC_API_KEY) {
        throw new Error("Anthropic key required for Claude models. Add ANTHROPIC_API_KEY in Settings.");
      }
      return {
        base_url: "https://api.anthropic.com",
        api_key: keys.ANTHROPIC_API_KEY,
        model: selectedModel,
        provider: "anthropic",
        key_prefix: maskKey(keys.ANTHROPIC_API_KEY),
        routing_mode: "direct",
      };
    }
    case "openai": {
      if (!keys.OPENAI_API_KEY) {
        throw new Error("OpenAI key required for GPT models. Add OPENAI_API_KEY in Settings.");
      }
      return {
        base_url: "https://api.openai.com",
        api_key: keys.OPENAI_API_KEY,
        model: selectedModel,
        provider: "openai",
        key_prefix: maskKey(keys.OPENAI_API_KEY),
        routing_mode: "direct",
      };
    }
    case "gemini": {
      if (!keys.GEMINI_API_KEY) {
        throw new Error("Gemini key required. Add GEMINI_API_KEY in Settings.");
      }
      return {
        base_url: "https://generativelanguage.googleapis.com",
        api_key: keys.GEMINI_API_KEY,
        model: selectedModel,
        provider: "gemini",
        key_prefix: maskKey(keys.GEMINI_API_KEY),
        routing_mode: "direct",
      };
    }
    default: {
      // Unknown model → fall back to Anthropic
      if (!keys.ANTHROPIC_API_KEY) {
        throw new Error("No API key found for model " + selectedModel);
      }
      return {
        base_url: "https://api.anthropic.com",
        api_key: keys.ANTHROPIC_API_KEY,
        model: selectedModel,
        provider: "anthropic",
        key_prefix: maskKey(keys.ANTHROPIC_API_KEY),
        routing_mode: "direct",
      };
    }
  }
}

// ── Gateway Model Catalog ───────────────────────────────────────────
// All models available through Vercel AI Gateway, grouped by provider.
export const GATEWAY_MODELS = [
  // DeepSeek
  { value: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro", provider: "deepseek", icon: "🌊" },
  { value: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash", provider: "deepseek", icon: "🌊" },
  { value: "deepseek/deepseek-v4-reasoner", label: "DeepSeek V4 Reasoner", provider: "deepseek", icon: "🌊" },
  { value: "deepseek/deepseek-coder", label: "DeepSeek Coder V4", provider: "deepseek", icon: "🌊" },
  // Anthropic
  { value: "anthropic/claude-opus-4.7", label: "Claude Opus 4.7", provider: "anthropic", icon: "🔵" },
  { value: "anthropic/claude-sonnet-4.7", label: "Claude Sonnet 4.7", provider: "anthropic", icon: "🔵" },
  { value: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5", provider: "anthropic", icon: "🔵" },
  // OpenAI
  { value: "openai/gpt-5.5", label: "GPT-5.5", provider: "openai", icon: "🟢" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini", provider: "openai", icon: "🟢" },
  { value: "openai/o3-mini", label: "o3-mini", provider: "openai", icon: "🟢" },
  // Gemini
  { value: "google/gemini-3-ultra", label: "Gemini 3 Ultra", provider: "google", icon: "💫" },
  { value: "google/gemini-3-pro", label: "Gemini 3 Pro", provider: "google", icon: "💫" },
  { value: "google/gemini-3-flash", label: "Gemini 3 Flash", provider: "google", icon: "💫" },
  // xAI
  { value: "xai/grok-4.3", label: "Grok 4.3", provider: "xai", icon: "⚫" },
  { value: "xai/grok-4.3-fast", label: "Grok 4.3 Fast", provider: "xai", icon: "⚫" },
  // Meta
  { value: "meta/llama-4-maverick", label: "Llama 4 Maverick", provider: "meta", icon: "🦙" },
  { value: "meta/llama-4-scout", label: "Llama 4 Scout", provider: "meta", icon: "🦙" },
  // Mistral
  { value: "mistral/mistral-large-3", label: "Mistral Large 3", provider: "mistral", icon: "✨" },
  { value: "mistral/codestral", label: "Codestral", provider: "mistral", icon: "✨" },
];

// Direct-mode model catalog — only models usable without the gateway.
export const DIRECT_MODELS = [
  { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro", provider: "deepseek", icon: "🌊", requiresKey: "DEEPSEEK_API_KEY" },
  { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash", provider: "deepseek", icon: "🌊", requiresKey: "DEEPSEEK_API_KEY" },
  { value: "deepseek-v4-reasoner", label: "DeepSeek V4 Reasoner", provider: "deepseek", icon: "🌊", requiresKey: "DEEPSEEK_API_KEY" },
  { value: "claude-opus-4.7", label: "Claude Opus 4.7", provider: "anthropic", icon: "🔵", requiresKey: "ANTHROPIC_API_KEY" },
  { value: "claude-sonnet-4.7", label: "Claude Sonnet 4.7", provider: "anthropic", icon: "🔵", requiresKey: "ANTHROPIC_API_KEY" },
  { value: "claude-haiku-4.5", label: "Claude Haiku 4.5", provider: "anthropic", icon: "🔵", requiresKey: "ANTHROPIC_API_KEY" },
  { value: "gpt-5.5", label: "GPT-5.5", provider: "openai", icon: "🟢", requiresKey: "OPENAI_API_KEY" },
  { value: "gpt-5-mini", label: "GPT-5 Mini", provider: "openai", icon: "🟢", requiresKey: "OPENAI_API_KEY" },
];

// ── Helpers ──────────────────────────────────────────────────────────

function readAllKeys(): UserKeySet {
  return {
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };
}

export function normalizeToGatewayFormat(model: string): string {
  // Already in provider/model format
  if (model.includes("/")) return model;

  const map: Record<string, string> = {
    "deepseek-v4-pro": "deepseek/deepseek-v4-pro",
    "deepseek-v4-flash": "deepseek/deepseek-v4-flash",
    "deepseek-v4-reasoner": "deepseek/deepseek-v4-reasoner",
    "deepseek-coder": "deepseek/deepseek-coder",
    "claude-opus-4.7": "anthropic/claude-opus-4.7",
    "claude-sonnet-4.7": "anthropic/claude-sonnet-4.7",
    "claude-haiku-4.5": "anthropic/claude-haiku-4.5",
    "gpt-5.5": "openai/gpt-5.5",
    "gpt-5-mini": "openai/gpt-5-mini",
    "o3-mini": "openai/o3-mini",
    "gemini-3-ultra": "google/gemini-3-ultra",
    "gemini-3-pro": "google/gemini-3-pro",
    "gemini-3-flash": "google/gemini-3-flash",
    "grok-4.3": "xai/grok-4.3",
    "grok-4.3-fast": "xai/grok-4.3-fast",
    "llama-4-maverick": "meta/llama-4-maverick",
    "llama-4-scout": "meta/llama-4-scout",
    "mistral-large-3": "mistral/mistral-large-3",
    "codestral": "mistral/codestral",
  };
  return map[model] || `anthropic/${model}`;
}

export function extractProvider(model: string): string {
  if (model.startsWith("deepseek") || model.startsWith("deepseek/")) return "deepseek";
  if (model.startsWith("claude") || model.startsWith("anthropic/")) return "anthropic";
  if (model.startsWith("gpt") || model.startsWith("o3") || model.startsWith("openai/")) return "openai";
  if (model.startsWith("gemini") || model.startsWith("google/")) return "google";
  if (model.startsWith("grok") || model.startsWith("xai/")) return "xai";
  if (model.startsWith("llama") || model.startsWith("meta/")) return "meta";
  if (model.startsWith("mistral") || model.startsWith("codestral")) return "mistral";
  return "anthropic";
}

export function inferProviderFromModel(model: string): { provider: string } {
  return { provider: extractProvider(model) };
}

export function maskKey(key: string | undefined): string {
  if (!key) return "";
  if (key.length <= 8) return key[0] + "***";
  return key.slice(0, 3) + "..." + key.slice(-4);
}
