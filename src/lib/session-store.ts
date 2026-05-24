/**
 * session-store.ts — Zustand store for ephemeral chat session state.
 *
 * Solves P5 (Session State Cache): navigating away and back to a conversation
 * should NOT re-fetch all messages. This store caches hydrated message arrays
 * keyed by conversation ID so re-mounting is instant.
 *
 * Also caches the last-seq number for incremental resume.
 *
 * LRU eviction: max 10 conversations cached.
 */
"use client";

import { create } from "zustand";
import type { HydratedMessage } from "@/hooks/useConversationReplay";

interface SessionCache {
  messages: HydratedMessage[];
  lastSeq: number;
  cachedAt: number; // Date.now()
}

interface SessionState {
  /** Per-conversation caches */
  caches: Record<string, SessionCache>;
  /** Currently active conversation ID */
  activeCid: string | null;

  // Actions
  setActiveCid: (cid: string | null) => void;
  cacheMessages: (cid: string, messages: HydratedMessage[], lastSeq: number) => void;
  getCachedMessages: (cid: string) => HydratedMessage[] | null;
  getCachedLastSeq: (cid: string) => number;
  invalidate: (cid: string) => void;
  clearAll: () => void;
  /** Remove oldest entries when > MAX_CACHED */
  prune: () => void;
}

const MAX_CACHED = 10;
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes before cache considered stale

export const useSessionStore = create<SessionState>((set, get) => ({
  caches: {},
  activeCid: null,

  setActiveCid: (cid) => set({ activeCid: cid }),

  cacheMessages: (cid, messages, lastSeq) => {
    set((state) => {
      const next = {
        ...state.caches,
        [cid]: { messages, lastSeq, cachedAt: Date.now() },
      };
      return { caches: next };
    });
    // Prune after every cache op
    get().prune();
  },

  getCachedMessages: (cid) => {
    const entry = get().caches[cid];
    if (!entry) return null;
    // Return null if stale (caller should re-fetch)
    if (Date.now() - entry.cachedAt > MAX_AGE_MS) return null;
    return entry.messages;
  },

  getCachedLastSeq: (cid) => {
    return get().caches[cid]?.lastSeq ?? 0;
  },

  invalidate: (cid) => {
    set((state) => {
      const next = { ...state.caches };
      delete next[cid];
      return { caches: next };
    });
  },

  clearAll: () => set({ caches: {} }),

  prune: () => {
    set((state) => {
      const entries = Object.entries(state.caches);
      if (entries.length <= MAX_CACHED) return state;

      // Sort by cachedAt (oldest first) and drop oldest
      entries.sort(([, a], [, b]) => a.cachedAt - b.cachedAt);
      const toDrop = entries.length - MAX_CACHED;
      const dropped = new Set(entries.slice(0, toDrop).map(([k]) => k));

      const next: Record<string, SessionCache> = {};
      for (const [k, v] of entries.slice(toDrop)) {
        next[k] = v;
      }
      return { caches: next };
    });
  },
}));
