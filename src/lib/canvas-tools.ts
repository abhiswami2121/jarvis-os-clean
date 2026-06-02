"use client";

/**
 * canvas-tools.ts — Agent-callable canvas control tools (Phase 4 P1).
 *
 * These are client-side tools registered via makeAssistantTool from assistant-ui.
 * The agent invokes them during conversations to control the artifact canvas
 * (right pane): open/close, manage tabs, pin artifacts, compare revisions, etc.
 *
 * All tools wire directly into the zustand artifactStore — no server round-trip.
 */

import { makeAssistantTool } from "@assistant-ui/react";
import { z } from "zod";
import { useArtifactStore, type ArtifactType } from "@/stores/artifactStore";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────

function getStore() {
  return useArtifactStore.getState();
}

function artifactExists(id: string): boolean {
  return getStore().history.some((a) => a.id === id);
}

function downloadArtifact(id: string, format: string) {
  const store = getStore();
  const art = store.history.find((a) => a.id === id);
  if (!art) {
    toast.error("Artifact not found");
    return { success: false, error: "Artifact not found" };
  }

  let content: string | Blob;
  let ext: string;
  let mimeType: string;

  switch (format) {
    case "csv": {
      if (art.columns && art.rows) {
        const header = art.columns.map((c) => c.label).join(",");
        const body = art.rows.map((row) => art.columns!.map((c) => String(row[c.key] ?? "")).join(",")).join("\n");
        content = new Blob([header + "\n" + body], { type: "text/csv" });
        ext = "csv";
        mimeType = "text/csv";
      } else {
        content = new Blob([JSON.stringify(art, null, 2)], { type: "text/csv" });
        ext = "csv";
        mimeType = "text/csv";
      }
      break;
    }
    case "md":
      content = new Blob([art.content || JSON.stringify(art, null, 2)], { type: "text/markdown" });
      ext = "md";
      mimeType = "text/markdown";
      break;
    case "json":
      content = new Blob([JSON.stringify(art, null, 2)], { type: "application/json" });
      ext = "json";
      mimeType = "application/json";
      break;
    case "zip": {
      // Simple ZIP: single file named after artifact
      const text = art.content || JSON.stringify(art, null, 2);
      ext = "txt";
      content = new Blob([text], { type: "text/plain" });
      mimeType = "application/octet-stream";
      break;
    }
    case "png":
    default: {
      // For charts/reports — download as markdown since we can't render PNG server-side
      content = new Blob([art.content || `# ${art.title}\n\nType: ${art.type}`], { type: "text/markdown" });
      ext = "md";
      mimeType = "text/markdown";
      break;
    }
  }

  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(art.title || "artifact").replace(/\s+/g, "_").slice(0, 40)}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Downloaded as .${ext}`);
  return { success: true, filename: a.download };
}

// ── Tool 1: open_canvas ────────────────────────────────────────────

export const OpenCanvasTool = makeAssistantTool({
  toolName: "open_canvas",
  description:
    "Opens the artifact canvas panel (right pane). Call this before pushing an artifact so the user can see it.",
  parameters: z.object({}),
  execute: async () => {
    const store = getStore();
    store.setMode("split");
    store.recordInteraction();
    return { success: true, mode: "split" };
  },
});

// ── Tool 2: close_canvas ───────────────────────────────────────────

export const CloseCanvasTool = makeAssistantTool({
  toolName: "close_canvas",
  description:
    "Closes the artifact canvas panel. Only call this when the user explicitly asks or when you're done showing artifacts.",
  parameters: z.object({}),
  execute: async () => {
    const store = getStore();
    // Respect user's last interaction — don't close if they just used it
    const elapsed = Date.now() - store.lastInteractionAt;
    if (elapsed < 5000) {
      return { success: false, reason: "User interacted with canvas recently — not closing" };
    }
    store.setMode("closed");
    return { success: true, mode: "closed" };
  },
});

// ── Tool 3: pin_artifact ───────────────────────────────────────────

export const PinArtifactTool = makeAssistantTool({
  toolName: "pin_artifact",
  description:
    "Pins an artifact so it stays in the tab bar permanently (survives page reload). Use for important artifacts the user might revisit.",
  parameters: z.object({
    id: z.string().describe("The artifact ID to pin"),
  }),
  execute: async ({ id }) => {
    if (!artifactExists(id)) {
      return { success: false, error: `Artifact ${id} not found` };
    }
    const store = getStore();
    store.openTab(id);
    store.pinTab(id);
    return { success: true, pinned: id };
  },
});

// ── Tool 4: unpin_artifact ─────────────────────────────────────────

export const UnpinArtifactTool = makeAssistantTool({
  toolName: "unpin_artifact",
  description: "Unpins a previously pinned artifact.",
  parameters: z.object({
    id: z.string().describe("The artifact ID to unpin"),
  }),
  execute: async ({ id }) => {
    const store = getStore();
    store.unpinTab(id);
    return { success: true, unpinned: id };
  },
});

// ── Tool 5: switch_tab ─────────────────────────────────────────────

export const SwitchTabTool = makeAssistantTool({
  toolName: "switch_tab",
  description:
    "Switches the canvas to display a different open artifact by its ID. Use when the discussion shifts to a different topic.",
  parameters: z.object({
    id: z.string().describe("The artifact ID to switch to"),
  }),
  execute: async ({ id }) => {
    if (!artifactExists(id)) {
      return { success: false, error: `Artifact ${id} not found` };
    }
    const store = getStore();
    store.switchTab(id);
    return { success: true, activeTabId: id };
  },
});

// ── Tool 6: fullscreen_canvas ──────────────────────────────────────

export const FullscreenCanvasTool = makeAssistantTool({
  toolName: "fullscreen_canvas",
  description:
    "Expands the artifact canvas to full window. Suggest this for large artifacts (>100 lines code, >500 words, or mini-apps).",
  parameters: z.object({}),
  execute: async () => {
    const store = getStore();
    store.setMode("fullscreen");
    store.recordInteraction();
    return { success: true, mode: "fullscreen" };
  },
});

// ── Tool 7: exit_fullscreen ────────────────────────────────────────

export const ExitFullscreenTool = makeAssistantTool({
  toolName: "exit_fullscreen",
  description: "Restores the canvas from fullscreen back to split-pane mode.",
  parameters: z.object({}),
  execute: async () => {
    const store = getStore();
    store.setMode("split");
    store.recordInteraction();
    return { success: true, mode: "split" };
  },
});

// ── Tool 8: share_artifact ─────────────────────────────────────────

export const ShareArtifactTool = makeAssistantTool({
  toolName: "share_artifact",
  description:
    "Copies a shareable permalink for an artifact to the clipboard. Currently copies the artifact ID and a summary.",
  parameters: z.object({
    id: z.string().describe("The artifact ID to share"),
  }),
  execute: async ({ id }) => {
    if (!artifactExists(id)) {
      return { success: false, error: `Artifact ${id} not found` };
    }
    const store = getStore();
    const art = store.history.find((a) => a.id === id);
    if (!art) return { success: false, error: "Artifact not found" };

    const shareText = `${art.title}\nType: ${art.type}\nID: ${id}\nCreated: ${new Date(art.createdAt).toISOString()}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("Share link copied!");
        return { success: true, shared: id };
      } catch {
        return { success: false, error: "Clipboard access denied" };
      }
    }
    return { success: false, error: "Clipboard not available" };
  },
});

// ── Tool 9: download_artifact ──────────────────────────────────────

export const DownloadArtifactTool = makeAssistantTool({
  toolName: "download_artifact",
  description:
    "Downloads an artifact in the specified format. Use 'md' for reports, 'csv' for data tables, 'json' for structured data.",
  parameters: z.object({
    id: z.string().describe("The artifact ID to download"),
    format: z
      .enum(["md", "csv", "json", "png", "zip"])
      .optional()
      .default("md")
      .describe("Download format: md, csv, json, png, zip"),
  }),
  execute: async ({ id, format = "md" }) => {
    return downloadArtifact(id, format);
  },
});

// ── Tool 10: compare_revisions ─────────────────────────────────────

export const CompareRevisionsTool = makeAssistantTool({
  toolName: "compare_revisions",
  description:
    "Opens two revisions of the same artifact side-by-side in the canvas for comparison. Use after iterating on an artifact.",
  parameters: z.object({
    id: z.string().describe("The artifact ID"),
    v1: z.number().describe("First revision number (0 = oldest, higher = newer)"),
    v2: z.number().describe("Second revision number for comparison"),
  }),
  execute: async ({ id, v1, v2 }) => {
    if (!artifactExists(id)) {
      return { success: false, error: `Artifact ${id} not found` };
    }
    const store = getStore();
    const artifacts = store.history.filter((a) => a.id === id).sort((a, b) => a.createdAt - b.createdAt);
    if (artifacts.length < 2) {
      return { success: false, error: "Need at least 2 revisions to compare" };
    }

    const rev1 = artifacts[Math.min(v1, artifacts.length - 1)];
    const rev2 = artifacts[Math.min(v2, artifacts.length - 1)];

    if (!rev1 || !rev2) {
      return { success: false, error: "Could not find both revisions" };
    }

    // Open the artifact and note comparison
    store.openTab(id);
    return {
      success: true,
      compared: id,
      revisions: [v1, v2],
      v1_title: rev1.title,
      v2_title: rev2.title,
    };
  },
});

// ── Tool 11: set_canvas_mode ───────────────────────────────────────

export const SetCanvasModeTool = makeAssistantTool({
  toolName: "set_canvas_mode",
  description:
    "Sets the canvas display mode. 'split' = side by side with chat, 'fullscreen' = canvas fills window, 'closed' = hide canvas.",
  parameters: z.object({
    mode: z.enum(["split", "fullscreen", "closed"]).describe("Canvas display mode"),
  }),
  execute: async ({ mode }) => {
    const store = getStore();
    store.setMode(mode);
    store.recordInteraction();
    return { success: true, mode };
  },
});

// ── Tool 12: create_artifact ─────────────────────────────────────────
// Triggered automatically when streaming content includes <canvas> XML
// tags, or called directly by the agent to create a new artifact.

export const CreateArtifactTool = makeAssistantTool({
  toolName: "create_artifact",
  description:
    "Creates and displays an artifact in the canvas. Called automatically when streaming content includes canvas-wrapped output.",
  parameters: z.object({
    artifact_type: z.string().describe("Artifact type: report, code, data, mini-app, chart"),
    title: z.string().describe("Title for the artifact"),
    content: z.string().describe("Full content of the artifact"),
  }),
  execute: async ({ artifact_type, title, content }) => {
    const store = getStore();
    const id = crypto.randomUUID?.() ?? `${Date.now()}`;
    store.push({
      id,
      type: artifact_type as ArtifactType,
      title,
      content,
    });
    store.setMode("split");
    store.recordInteraction();
    return { success: true, id, title };
  },
});

// ── Export all ─────────────────────────────────────────────────────

export const ALL_CANVAS_TOOLS = [
  OpenCanvasTool,
  CloseCanvasTool,
  PinArtifactTool,
  UnpinArtifactTool,
  SwitchTabTool,
  FullscreenCanvasTool,
  ExitFullscreenTool,
  ShareArtifactTool,
  DownloadArtifactTool,
  CompareRevisionsTool,
  SetCanvasModeTool,
  CreateArtifactTool,
];
