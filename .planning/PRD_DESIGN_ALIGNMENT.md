# PRD: Jarvis OS — Open Design Alignment & Canvas Hardening

**Date:** 2026-06-03  
**Status:** IN PROGRESS  
**Repo:** jarvis-os-clean (`/home/hermes/repos/jarvis-os-clean/`)  
**Related:** open-design daemon (`/home/hermes/open-design/`, :7456)

---

## 1. Executive Summary

Align the jarvis-os-clean chat UI with open-design's design language (the open-source Claude Design alternative), fix the fractured canvas/artifact rendering pipeline, bridge the open-design daemon properly, and unify the connector experience — all without breaking the currently-functional chat.

### Current State Assessment

| System | Status | Critical Issues |
|--------|--------|-----------------|
| open-design daemon | 🟢 RUNNING (:7456, PM2, v0.6.0) | Plugin manifest has wrong sourcePath; no /health endpoint |
| jarvis-os-clean app | 🟢 RUNNING (:3001, Next.js 16) | Chat works; history seeding fixed (2026-06-03) |
| Canvas rendering | 🟡 PARTIALLY BROKEN | CanvasOverlay ORPHANED; ArtifactPanel works but suboptimal |
| Artifact detection | 🟢 WORKS | ArtifactAwareText detects blocks but pushes to wrong store |
| Connector menu | 🟡 PARTIALLY WIRED | Claude-style + menu exists but static catalog, not dynamic |
| Design bridge | 🔴 NOT INTEGRATED | /api/design/ proxy exists but zero components use it |
| History persistence | 🟢 FIXED | Page-level seeding via initialMessages (no double UI) |

---

## 2. Architecture Map

```
┌──────────────────────────────────────────────────────────────────┐
│                     VPS (hermes)                                  │
│                                                                   │
│  ┌─────────────────────┐    ┌──────────────────────────────┐     │
│  │ open-design daemon   │    │ jarvis-os-clean (Next.js)     │     │
│  │ :7456                │    │ :3001                         │     │
│  │                      │    │                               │     │
│  │ /api/skills          │◄───│ /api/design/* (proxy rewrite) │     │
│  │ /api/design-systems  │    │                               │     │
│  │ /api/live-artifacts  │    │ Chat UI (assistant-ui)        │     │
│  │ /api/connectors/*    │    │  ├─ thread.tsx (768 loc)      │     │
│  │ /api/proxy/*         │    │  ├─ ConnectorMenu.tsx         │     │
│  │ /api/tools/* (MCP)   │    │  ├─ ConnectorPlusMenu.tsx     │     │
│  │ 140+ design skills   │    │  └─ ConnectorChatSheet.tsx    │     │
│  │ 160+ design systems  │    │                               │     │
│  └─────────────────────┘    │ Artifacts Pipeline              │     │
│                              │  ├─ ArtifactAwareText ──► useArtifactStore │
│  ┌─────────────────────┐    │  ├─ ArtifactPanel (WORKS)      │     │
│  │ Claude Agent SDK     │    │  └─ CanvasOverlay (ORPHANED)   │     │
│  │ workspace            │    │                               │     │
│  │ /home/hermes/        │    │ Canvas System                  │     │
│  │ claude-agent-api/    │◄───│  ├─ CanvasOverlay.tsx (298 loc)│    │
│  │ workspaces/default   │    │  ├─ CanvasFrame.tsx            │     │
│  └─────────────────────┘    │  ├─ TemplateRenderer.tsx       │     │
│                              │  └─ useCanvasStore (ORPHANED)  │     │
│  ┌─────────────────────┐    │                               │     │
│  │ jarvis-core          │    │ Connector System               │     │
│  │ (parallel repo)      │    │  ├─ useConnectorsStore (Zustand)│    │
│  └─────────────────────┘    │  ├─ marketplace-data.ts (18)   │     │
│                              │  └─ ConnectionFormModal.tsx    │     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Critical Issues & Fix Plan

### Issue 1: CanvasOverlay is Orphaned (CRITICAL)

**Root Cause:** `ArtifactAwareText` line 53-57 pushes `<canvas>` XML tags to `useArtifactStore` (ArtifactPanel) instead of `useCanvasStore` (CanvasOverlay). The `CanvasOverlay` component, `CanvasFrame`, and `TemplateRenderer` are fully built but never triggered.

**Fix:**
1. Add `<canvas>` tag dispatch to `useCanvasStore.open()` in `ArtifactAwareText.tsx`
2. Wire `CanvasTrigger` to the artifact detection pipeline
3. Add `useCanvasStore` integration in `chat/[id]/page.tsx`
4. Ensure artifact type → canvas template mapping is complete

**Files to modify:**
- `src/components/artifacts/ArtifactAwareText.tsx` — add `useCanvasStore.open()` call
- `src/app/chat/[id]/page.tsx` — mount `CanvasOverlay` alongside `ArtifactPanel`
- `src/lib/artifacts/types.ts` — expand schema for new artifact types

### Issue 2: Plugin Manifest Wrong Path (LOW)

**Root Cause:** `/home/hermes/plugins/open-design/manifest.json` has `sourcePath: "/home/opendesign/open-design"` but the actual path is `/home/hermes/open-design`.

**Fix:** Update `sourcePath` to `/home/hermes/open-design`.

### Issue 3: Design Bridge Not Integrated (HIGH)

**Root Cause:** `next.config.ts` has the `/api/design/:path*` → `:7456/api/:path*` proxy rewrite, but no component in the chat UI calls these endpoints. The open-design design systems and skills are completely disconnected.

**Fix:**
1. Create `src/lib/open-design-client.ts` — typed client for the open-design API
2. Add design system selector to chat UI (leveraging open-design's 160+ systems)
3. Wire design system tokens from open-design into the CSS custom properties
4. Add `/design` page improvements (already exists as iframe)

### Issue 4: Canvas Type Fidelity Loss (MEDIUM)

**Root Cause:** `ArtifactAwareText.tsx` lines 93-98 maps `status_card` and `data_table` both to `"data"` type, losing the original artifact type. The rich JSON structure is flattened to `JSON.stringify(artifact, null, 2)` as plain text.

**Fix:** Pass the parsed artifact object directly to the store, preserving type and structure for the renderer to use.

### Issue 5: Connector Menu — Static to Dynamic (MEDIUM)

**Root Cause:** `ConnectorMenu.tsx` has hardcoded connector entries. The + menu should be dynamic, pulling from `useConnectorsStore` and reflecting actual configured MCP servers.

**Fix:**
1. Replace hardcoded entries with store-driven list
2. Add quick-connect actions for MCP tools
3. Surface open-design skills as installable "connectors"
4. Add attachment upload for any file type (currently paperclip but limited)

---

## 4. Execution Plan

### Phase A: Fix Plugin & Bridge (Safe, No Breaking Changes)
| Task | File | Risk |
|------|------|------|
| Fix plugin manifest sourcePath | `/home/hermes/plugins/open-design/manifest.json` | None |
| Create open-design API client | `src/lib/open-design-client.ts` (NEW) | None |
| Verify proxy rewrite works | Test `/api/design/skills` | None |

### Phase B: Harden Canvas (Medium Risk — Two Canvases Merge)
| Task | File | Risk |
|------|------|------|
| Fix `<canvas>` tag routing | `ArtifactAwareText.tsx` | Medium |
| Mount CanvasOverlay in chat page | `chat/[id]/page.tsx` | Medium |
| Expand artifact schema | `lib/artifacts/types.ts` | Low |
| Wire CanvasTrigger to detection | `canvas/CanvasTrigger.tsx` | Low |

### Phase C: Align Chat UI Design (Higher Risk — Visual Changes)
| Task | File | Risk |
|------|------|------|
| Import open-design design tokens | `styles/tokens.css` | Medium |
| Update connector menu to be dynamic | `chat/ConnectorMenu.tsx` | Medium |
| Add design system selector | New component in chat | Medium |
| Polish chat composition area | `assistant-ui/thread.tsx` | Medium |

### Phase D: Verify Nothing Broken
| Task | Method |
|------|--------|
| Smoke test chat | Send message, verify response |
| Verify history loading | Refresh conversation, verify no double UI |
| Test canvas rendering | Trigger `<canvas>` tag, verify overlay |
| Test connector menu | Open + menu, verify store-driven entries |
| Test open-design bridge | Check `/api/design/skills` response |

---

## 5. Success Criteria

1. **Canvas renders** when `<canvas>` XML tags are in agent response
2. **Chat UI aligns** with Claude-like design language from open-design
3. **Connector + menu** shows dynamic, configured connectors (not hardcoded)
4. **open-design bridge** exposes skills/design systems to the chat
5. **No regressions** — chat, history, streaming all work as before
6. **Artifact type fidelity** — data_table renders as sortable table, not raw JSON string
