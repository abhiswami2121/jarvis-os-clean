import { NextResponse } from "next/server";

// Platform health check — called by the frontend to show live status of all connected platforms.
// Each check does a lightweight HEAD/GET to the platform's health endpoint.
// Timeout 8s per check, aggregated response in <10s total.

interface PlatformHealth {
  name: string;
  key: string;
  status: "connected" | "disconnected" | "error" | "unknown";
  latencyMs?: number;
  error?: string;
  endpoint?: string;
  category: "crm" | "payments" | "project_mgmt" | "automation" | "ai" | "comms";
}

const PLATFORMS: { key: string; name: string; endpoint: string; category: PlatformHealth["category"]; method?: string }[] = [
  {
    key: "twenty",
    name: "Twenty CRM",
    endpoint: process.env.TWENTY_API_URL || "https://twenty.newleaf.financial/api/rest/health",
    category: "crm",
  },
  {
    key: "hyperswitch",
    name: "Hyperswitch Payments",
    endpoint: process.env.HYPERSWITCH_API_URL || "https://api.hyperswitch.io/health",
    category: "payments",
  },
  {
    key: "linear",
    name: "Linear",
    endpoint: "https://api.linear.app/graphql",
    category: "project_mgmt",
    method: "POST",
  },
  {
    key: "n8n",
    name: "n8n Automation",
    endpoint: process.env.N8N_URL || "https://n8n.newleaf.financial/healthz",
    category: "automation",
  },
  {
    key: "dify",
    name: "Dify AI",
    endpoint: process.env.DIFY_URL || "https://dify.newleaf.financial/health",
    category: "ai",
  },
  {
    key: "slack",
    name: "Slack",
    endpoint: "https://slack.com/api/auth.test",
    category: "comms",
    method: "POST",
  },
  {
    key: "base44",
    name: "Base44 Backend",
    endpoint: "https://app.base44.com/api/health",
    category: "automation",
  },
  {
    key: "langfuse",
    name: "Langfuse Observability",
    endpoint: "https://cloud.langfuse.com/api/public/health",
    category: "ai",
  },
];

export async function GET() {
  const results: PlatformHealth[] = [];

  const checks = PLATFORMS.map(async (p) => {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      let res: Response | null = null;
      if (p.method === "POST") {
        // GraphQL/API endpoints that need POST — send minimal body
        const body = p.key === "linear" ? JSON.stringify({ query: "{ viewer { id } }" }) : undefined;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (p.key === "slack" && process.env.SLACK_BOT_TOKEN) {
          headers["Authorization"] = `Bearer ${process.env.SLACK_BOT_TOKEN}`;
        }
        res = await fetch(p.endpoint, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
        }).catch(() => null);
      } else {
        res = await fetch(p.endpoint, {
          method: "HEAD",
          signal: controller.signal,
        }).catch(() => null);
      }

      clearTimeout(timeout);
      const latency = Date.now() - start;

      if (!res) {
        results.push({ ...p, status: "disconnected", latencyMs: latency, error: "No response" });
      } else if (res.ok) {
        results.push({ ...p, status: "connected", latencyMs: latency });
      } else {
        results.push({ ...p, status: "error", latencyMs: latency, error: `HTTP ${res.status}` });
      }
    } catch (e: any) {
      const latency = Date.now() - start;
      results.push({
        ...p,
        status: e.name === "AbortError" ? "disconnected" : "error",
        latencyMs: latency,
        error: e.name === "AbortError" ? "Timeout (8s)" : e.message?.slice(0, 100),
      });
    }
  });

  await Promise.all(checks);

  // Sort: connected first, then by name
  results.sort((a, b) => {
    const order = { connected: 0, unknown: 1, error: 2, disconnected: 3 };
    return (order[a.status] ?? 2) - (order[b.status] ?? 2) || a.name.localeCompare(b.name);
  });

  const connectedCount = results.filter((r) => r.status === "connected").length;
  const overall = connectedCount === results.length ? "healthy" : connectedCount > 0 ? "degraded" : "offline";

  return NextResponse.json({
    overall,
    connectedCount,
    total: results.length,
    platforms: results,
    checkedAt: new Date().toISOString(),
  });
}
