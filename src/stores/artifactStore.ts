"use client";

import { create } from "zustand";

// ── Types ──────────────────────────────────────────────────────────

export type ArtifactType = "report" | "code" | "data" | "mini-app" | "chart";

export type CanvasMode = "split" | "fullscreen" | "closed";

export interface CodeFile {
  path: string;
  content: string;
  language?: string;
}

export interface DataColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export interface ArtifactRevision {
  id: string;
  type: ArtifactType;
  title: string;
  content?: string;
  files?: CodeFile[];
  columns?: DataColumn[];
  rows?: Record<string, unknown>[];
  totalRows?: number;
  src?: string;
  createdAt: number;
}

export interface ArtifactStoreState {
  /** Currently displayed artifact (backwards compat) */
  current: ArtifactRevision | null;
  /** Revision history (latest first) */
  history: ArtifactRevision[];
  /** Panel visibility (backwards compat — derived from mode !== 'closed') */
  isOpen: boolean;

  // ── Phase 4 P1: Multi-tab ────────────────────────────────────────

  /** Ordered list of open tab artifact IDs (max 8 desktop, 4 mobile) */
  tabs: string[];
  /** Set of pinned artifact IDs (survive page reload) */
  pinnedIds: string[];
  /** Currently active tab ID */
  activeTabId: string | null;
  /** Canvas display mode */
  mode: CanvasMode;
  /** Last user interaction timestamp (prevent agent from auto-closing) */
  lastInteractionAt: number;

  // ── Actions ──────────────────────────────────────────────────────

  /** Push a new artifact revision onto history and display it */
  push: (artifact: Omit<ArtifactRevision, "id" | "createdAt"> & { id?: string; createdAt?: number }) => void;
  /** Close the side panel (sets mode to 'closed') */
  close: () => void;
  /** Re-open the panel */
  openPanel: () => void;
  /** Clear all history and close */
  clear: () => void;
  /** Select a specific revision from history */
  selectRevision: (id: string) => void;
  /** Update current artifact in-place (for streaming content) */
  updateCurrent: (patch: Partial<ArtifactRevision>) => void;

  // ── Tab actions ──────────────────────────────────────────────────

  /** Open an artifact as a new tab */
  openTab: (id: string) => void;
  /** Close a tab by ID */
  closeTab: (id: string) => void;
  /** Switch to a different tab */
  switchTab: (id: string) => void;
  /** Pin a tab (persists across reload) */
  pinTab: (id: string) => void;
  /** Unpin a tab */
  unpinTab: (id: string) => void;
  /** Set canvas display mode */
  setMode: (mode: CanvasMode) => void;
  /** Record user interaction timestamp */
  recordInteraction: () => void;
}

// ── Persistence helpers ────────────────────────────────────────────

const LS_KEY = "newleaf:artifacts";
const LS_TABS_KEY = "newleaf:artifacts:tabs";
const LS_PINS_KEY = "newleaf:artifacts:pins";
const LS_MODE_KEY = "newleaf:artifacts:mode";

function loadHistory(): ArtifactRevision[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history: ArtifactRevision[]) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = history.slice(0, 50);
    localStorage.setItem(LS_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable — silently degrade
  }
}

function loadTabs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(LS_TABS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTabs(tabs: string[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LS_TABS_KEY, JSON.stringify(tabs));
  } catch { /* degrade */ }
}

function loadPinnedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_PINS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePinnedIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_PINS_KEY, JSON.stringify(ids));
  } catch { /* degrade */ }
}

function loadMode(): CanvasMode {
  if (typeof window === "undefined") return "closed";
  try {
    const raw = localStorage.getItem(LS_MODE_KEY);
    if (raw === "split" || raw === "fullscreen") return raw;
  } catch { /* */ }
  return "closed";
}

function saveMode(mode: CanvasMode) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_MODE_KEY, mode);
  } catch { /* degrade */ }
}

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

const MAX_TABS = 8;
const MAX_TABS_MOBILE = 4;

// ── Store ──────────────────────────────────────────────────────────

export const useArtifactStore = create<ArtifactStoreState>((set, get) => ({
  current: null,
  history: loadHistory(),
  isOpen: false,

  tabs: loadTabs(),
  pinnedIds: loadPinnedIds(),
  activeTabId: null,
  mode: loadMode(),
  lastInteractionAt: 0,

  push: (artifact) => {
    const revision: ArtifactRevision = {
      id: artifact.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: artifact.createdAt || Date.now(),
      type: artifact.type,
      title: artifact.title,
      ...(artifact.content != null && { content: artifact.content }),
      ...(artifact.files && { files: artifact.files }),
      ...(artifact.columns && { columns: artifact.columns }),
      ...(artifact.rows && { rows: artifact.rows }),
      ...(artifact.totalRows != null && { totalRows: artifact.totalRows }),
      ...(artifact.src && { src: artifact.src }),
    };

    const newHistory = [revision, ...get().history];
    saveHistory(newHistory);

    // Open as new tab (Phase 4 P1 multi-tab)
    const max = isMobile() ? MAX_TABS_MOBILE : MAX_TABS;
    const currentTabs = get().tabs.filter((id) => get().history.some((a) => a.id === id));
    let newTabs = [...currentTabs];

    // Don't duplicate
    if (!newTabs.includes(revision.id)) {
      if (newTabs.length >= max) {
        // Remove oldest unpinned tab to make room
        const pinned = new Set(get().pinnedIds);
        const unpinnedIndex = newTabs.findIndex((t) => !pinned.has(t));
        if (unpinnedIndex >= 0) {
          newTabs.splice(unpinnedIndex, 1);
        }
      }
      newTabs.push(revision.id);
    }
    saveTabs(newTabs);

    set({
      current: revision,
      history: newHistory,
      isOpen: true,
      mode: get().mode === "closed" ? "split" : get().mode,
      tabs: newTabs,
      activeTabId: revision.id,
    });
  },

  close: () => {
    saveMode("closed");
    set({ isOpen: false, mode: "closed" });
  },

  openPanel: () => {
    const { current, mode } = get();
    if (current) {
      const newMode = mode === "closed" ? "split" : mode;
      saveMode(newMode);
      set({ isOpen: true, mode: newMode });
    }
  },

  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_KEY);
      sessionStorage.removeItem(LS_TABS_KEY);
      localStorage.removeItem(LS_PINS_KEY);
      localStorage.removeItem(LS_MODE_KEY);
    }
    set({
      current: null,
      history: [],
      isOpen: false,
      tabs: [],
      activeTabId: null,
      mode: "closed",
    });
  },

  selectRevision: (id) => {
    const { history } = get();
    const found = history.find((a) => a.id === id);
    if (found) {
      set({ current: found, isOpen: true, activeTabId: id });
    }
  },

  updateCurrent: (patch) => {
    const { current, history } = get();
    if (!current) return;

    const updated: ArtifactRevision = { ...current, ...patch };
    const updatedHistory = history.map((a) => (a.id === current.id ? updated : a));
    saveHistory(updatedHistory);

    set({ current: updated, history: updatedHistory });
  },

  // ── Tab actions ──────────────────────────────────────────────────

  openTab: (id) => {
    const { history, tabs, pinnedIds } = get();
    if (!history.some((a) => a.id === id)) return;

    const max = isMobile() ? MAX_TABS_MOBILE : MAX_TABS;
    let newTabs = [...tabs];

    if (!newTabs.includes(id)) {
      if (newTabs.length >= max) {
        const pinned = new Set(pinnedIds);
        const unpinnedIndex = newTabs.findIndex((t) => !pinned.has(t));
        if (unpinnedIndex >= 0) newTabs.splice(unpinnedIndex, 1);
      }
      newTabs.push(id);
    }
    saveTabs(newTabs);

    const artifact = history.find((a) => a.id === id);
    set({
      tabs: newTabs,
      activeTabId: id,
      current: artifact || get().current,
      isOpen: true,
    });
  },

  closeTab: (id) => {
    const { tabs, activeTabId, pinnedIds, history } = get();
    const newTabs = tabs.filter((t) => t !== id);
    const newPins = pinnedIds.filter((p) => p !== id);
    saveTabs(newTabs);
    savePinnedIds(newPins);

    let nextActive = activeTabId;
    let nextCurrent = get().current;

    if (activeTabId === id || newTabs.length === 0) {
      if (newTabs.length > 0) {
        nextActive = newTabs[newTabs.length - 1];
        nextCurrent = history.find((a) => a.id === nextActive) || null;
      } else {
        nextActive = null;
        nextCurrent = null;
      }
    }

    set({
      tabs: newTabs,
      pinnedIds: newPins,
      activeTabId: nextActive,
      current: nextCurrent,
      isOpen: newTabs.length > 0,
      mode: newTabs.length === 0 ? "closed" : get().mode,
    });
  },

  switchTab: (id) => {
    const { history } = get();
    const artifact = history.find((a) => a.id === id);
    if (!artifact) return;

    set({ activeTabId: id, current: artifact, isOpen: true, lastInteractionAt: Date.now() });
  },

  pinTab: (id) => {
    const { pinnedIds } = get();
    if (pinnedIds.includes(id)) return;
    const newPins = [...pinnedIds, id];
    savePinnedIds(newPins);
    set({ pinnedIds: newPins });
  },

  unpinTab: (id) => {
    const newPins = get().pinnedIds.filter((p) => p !== id);
    savePinnedIds(newPins);
    set({ pinnedIds: newPins });
  },

  setMode: (mode) => {
    saveMode(mode);
    set({
      mode,
      isOpen: mode !== "closed",
      lastInteractionAt: Date.now(),
    });
  },

  recordInteraction: () => {
    set({ lastInteractionAt: Date.now() });
  },
}));

export default useArtifactStore;
