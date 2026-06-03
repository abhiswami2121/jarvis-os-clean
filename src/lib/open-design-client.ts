"use client";

/**
 * Open Design API Client — typed bridge to the local open-design daemon (:7456).
 *
 * All calls go through the Next.js proxy at /api/design/* which rewrites to
 * http://127.0.0.1:7456/api/* — keeping the daemon internal-only.
 *
 * Open Design is the open-source Claude Design alternative. It provides:
 *  - 140+ design skills (web prototypes, dashboards, decks, etc.)
 *  - 160+ design systems (brand palettes, typography, spacing tokens)
 *  - Live artifact generation (HTML, React, SVG)
 *  - Connector tools (Composio, MCP bridge)
 *  - Multi-agent support (16 CLIs auto-detected)
 *
 * Usage:
 *   import { od } from "@/lib/open-design-client";
 *   const skills = await od.listSkills();
 *   const systems = await od.listDesignSystems();
 */

const BASE = "/api/design";

// ── Types ──────────────────────────────────────────────────────────

export interface ODSkill {
  id: string;
  name: string;
  scenario: string; // design | marketing | operation | engineering | product | finance | hr | sale | personal
  surface: string;  // web | image | video | audio
  description?: string;
  examplePrompts?: string[];
  mode: string;     // prototype | deck | artifact
}

export interface ODDesignSystem {
  id: string;
  name: string;
  category: string;
  surface: string[];
  colors?: Record<string, string>;
  typography?: Record<string, string>;
  description?: string;
}

export interface ODGenerateParams {
  skillId: string;
  designSystemId?: string;
  prompt: string;
  model?: string;
  mode?: "fast" | "deep";
}

export interface ODGenerateResult {
  runId: string;
  status: "started" | "running" | "completed" | "failed";
  artifactUrl?: string;
}

export interface ODLiveArtifact {
  id: string;
  kind: string;      // html | deck | react-component | mini-app | svg | diagram
  title: string;
  content?: string;
  url?: string;
}

// ── API Client ─────────────────────────────────────────────────────

async function fetchOD<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Open Design API error ${res.status}: ${text.slice(0, 200)}`);
  }
  // Some endpoints return HTML (the Next.js app shell) — handle gracefully
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("text/html")) {
    throw new Error("Open Design daemon returned HTML — is it running?");
  }
  return res.json();
}

export const od = {
  /** List all available design skills */
  async listSkills(): Promise<ODSkill[]> {
    try {
      return await fetchOD<ODSkill[]>("/skills");
    } catch {
      // Fallback: return empty if daemon unreachable
      console.warn("[od] Failed to fetch skills — daemon unreachable?");
      return [];
    }
  },

  /** List all design systems */
  async listDesignSystems(): Promise<ODDesignSystem[]> {
    try {
      return await fetchOD<ODDesignSystem[]>("/design-systems");
    } catch {
      console.warn("[od] Failed to fetch design systems");
      return [];
    }
  },

  /** Start a design generation run */
  async generate(params: ODGenerateParams): Promise<ODGenerateResult> {
    return fetchOD<ODGenerateResult>("/runs", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  /** List live artifacts */
  async listLiveArtifacts(): Promise<ODLiveArtifact[]> {
    try {
      return await fetchOD<ODLiveArtifact[]>("/live-artifacts");
    } catch {
      return [];
    }
  },

  /** Get a live artifact by ID */
  async getLiveArtifact(id: string): Promise<ODLiveArtifact | null> {
    try {
      return await fetchOD<ODLiveArtifact>(`/live-artifacts/${id}`);
    } catch {
      return null;
    }
  },

  /** Check daemon health */
  async health(): Promise<boolean> {
    try {
      await fetchOD("/health");
      return true;
    } catch {
      return false;
    }
  },

  /** List available connectors/tools */
  async listConnectors(): Promise<any[]> {
    try {
      const res = await fetch(`${BASE}/tools/connectors/list`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },
};

export default od;
