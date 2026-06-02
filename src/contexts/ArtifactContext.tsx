"use client";

import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  useArtifactStore,
  type ArtifactStoreState,
  type ArtifactRevision,
  type ArtifactType,
  type CodeFile,
} from "@/stores/artifactStore";

// ── Context value ──────────────────────────────────────────────────

interface ArtifactContextValue extends ArtifactStoreState {
  /** Convenience: check if there's an active artifact */
  hasArtifact: boolean;
  /** Convenience: get diff between current and previous revision */
  diffFromPrevious: () => { additions: string[]; deletions: string[] } | null;
}

const ArtifactContext = createContext<ArtifactContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────

export function ArtifactProvider({ children }: { children: ReactNode }) {
  const store = useArtifactStore();

  const value = useMemo<ArtifactContextValue>(() => ({
    ...store,
    hasArtifact: store.current !== null,
    diffFromPrevious: () => {
      const { current, history } = store;
      if (!current || history.length < 2) return null;

      const prev = history[1]; // Second most recent
      if (!prev) return null;

      const additions: string[] = [];
      const deletions: string[] = [];

      if (current.content && prev.content) {
        const currLines = current.content.split("\n");
        const prevLines = prev.content.split("\n");

        for (const line of currLines) {
          if (!prevLines.includes(line) && line.trim()) {
            additions.push(line);
          }
        }
        for (const line of prevLines) {
          if (!currLines.includes(line) && line.trim()) {
            deletions.push(line);
          }
        }
      }

      // Also check file diffs
      if (current.files && prev.files) {
        for (const cf of current.files) {
          const pf = prev.files.find((f) => f.path === cf.path);
          if (pf && cf.content !== pf.content) {
            additions.push(`File changed: ${cf.path}`);
          } else if (!pf) {
            additions.push(`File added: ${cf.path}`);
          }
        }
        for (const pf of prev.files) {
          if (!current.files!.find((f) => f.path === pf.path)) {
            deletions.push(`File removed: ${pf.path}`);
          }
        }
      }

      return { additions, deletions };
    },
  }), [store]);

  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────

export function useArtifact(): ArtifactContextValue {
  const ctx = useContext(ArtifactContext);
  if (!ctx) {
    throw new Error("useArtifact must be used within an <ArtifactProvider>");
  }
  return ctx;
}

// Re-export types for convenience
export type { ArtifactRevision, ArtifactType, CodeFile };
export default ArtifactContext;
