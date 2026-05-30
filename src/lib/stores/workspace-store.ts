"use client";

import { create } from "zustand";
import type { Artifact } from "@/lib/artifacts/types";

// ── View Modes ────────────────────────────────────────────────────

export type WorkspaceViewMode =
  | "spreadsheet"   // Full interactive data table
  | "chart"         // Interactive chart
  | "report"        // Notion-like rich text canvas
  | "web_preview"   // Sandboxed HTML / URL iframe
  | "status_card"   // Dashboard metrics view
  | "action_panel"  // Action buttons view
  | "slack_canvas"  // Slack canvas preview
  | "code"          // Syntax-highlighted code
  | "app"           // Deployed MVP/demo app (iframe + controls)

// ── Workspace Item ────────────────────────────────────────────────

export interface WorkspaceItem {
  id: string;
  artifact: Artifact;
  viewMode: WorkspaceViewMode;
  title: string;
  openedAt: number; // timestamp
}

// ── Store State ───────────────────────────────────────────────────

interface WorkspaceState {
  // Drawer state
  isOpen: boolean;
  activeItemId: string | null;
  items: WorkspaceItem[]; // stack of open items (like tabs)

  // View-level state
  viewMode: WorkspaceViewMode;
  splitRatio: number; // 0-100, percentage for canvas (desktop split view)

  // Actions
  openArtifact: (artifact: Artifact, viewMode?: WorkspaceViewMode) => void;
  closeArtifact: (itemId: string) => void;
  closeAll: () => void;
  setViewMode: (mode: WorkspaceViewMode) => void;
  setSplitRatio: (ratio: number) => void;

  // Convenience
  activeItem: () => WorkspaceItem | null;
}

// ── View Mode Resolution ─────────────────────────────────────────

function resolveViewMode(artifact: Artifact): WorkspaceViewMode {
  switch (artifact.type) {
    case "data_table":
      return "spreadsheet";
    case "chart":
      return "chart";
    case "status_card":
      return "status_card";
    case "action_panel":
      return "action_panel";
    case "slack_canvas":
      return "slack_canvas";
    case "error_recovery":
      return "action_panel";
    case "deployed_app":
      return "app";
    default:
      return "report";
  }
}

function resolveTitle(artifact: Artifact): string {
  if ("title" in artifact && artifact.title) return artifact.title;
  switch (artifact.type) {
    case "data_table": return "Data Table";
    case "chart": return "Chart";
    case "status_card": return "Dashboard";
    case "action_panel": return "Actions";
    case "slack_canvas": return "Slack Canvas";
    case "error_recovery": return "Error Recovery";
    default: return "Artifact";
  }
}

// ── Store ─────────────────────────────────────────────────────────

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  isOpen: false,
  activeItemId: null,
  items: [],
  viewMode: "spreadsheet",
  splitRatio: 60,

  openArtifact: (artifact, viewMode) => {
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const resolvedMode = viewMode ?? resolveViewMode(artifact);
    const item: WorkspaceItem = {
      id,
      artifact,
      viewMode: resolvedMode,
      title: resolveTitle(artifact),
      openedAt: Date.now(),
    };

    set((state) => {
      // If the same artifact type+title is already open, replace it
      const existingIdx = state.items.findIndex(
        (i) => i.artifact.type === artifact.type && i.title === item.title
      );

      let newItems: WorkspaceItem[];
      if (existingIdx >= 0) {
        newItems = [...state.items];
        newItems[existingIdx] = item;
      } else {
        // Cap at 8 items to prevent memory bloat
        newItems = [...state.items, item].slice(-8);
      }

      return {
        isOpen: true,
        activeItemId: id,
        items: newItems,
        viewMode: resolvedMode,
      };
    });
  },

  closeArtifact: (itemId) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.id !== itemId);
      if (newItems.length === 0) {
        return { isOpen: false, activeItemId: null, items: [] };
      }
      // Activate the next item
      const closedIdx = state.items.findIndex((i) => i.id === itemId);
      const newActiveIdx = Math.min(closedIdx, newItems.length - 1);
      return {
        activeItemId: newItems[newActiveIdx]?.id ?? null,
        items: newItems,
        viewMode: newItems[newActiveIdx]?.viewMode ?? "spreadsheet",
      };
    });
  },

  closeAll: () => {
    set({ isOpen: false, activeItemId: null, items: [], viewMode: "spreadsheet" });
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setSplitRatio: (ratio) => set({ splitRatio: Math.min(100, Math.max(20, ratio)) }),

  activeItem: () => {
    const state = get();
    if (!state.activeItemId) return null;
    return state.items.find((i) => i.id === state.activeItemId) ?? null;
  },
}));
