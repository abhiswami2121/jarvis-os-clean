# Changelog

All notable changes to Jarvis Command Center (jarvis-os-clean).

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

## [Phase 5] — 2026-05-31 05:30 UTC

### Added
- **Operations Dashboard** at `/dashboard` — real-time metrics with 30s polling
- **`/api/dashboard` route** — server-side aggregation of Base44 entities (enrollments, payments, MRR, calls, tickets, recovery) with 30s cache
- **`MetricCard` component** — Aurora glass metric tiles with trend indicators
- **`SessionsCard` component** — infrastructure overview with progress bars (VPS sessions, MVPs, Golden Runs)
- **Golden Dataset** at `/home/hermes/data/golden_runs/` — 3 session maps with 5-dimension telemetry schema
- **`agent-run-mapping-protocol` skill** — reusable 5-dimension schema for session analysis
- Dashboard nav link in ChatTopBar
- `CHANGELOG.md` (this file) — Keep-A-Changelog format

### Changed
- Updated `jarvis-os-self-knowledge.md` with `/dashboard` route and Golden Dataset paths
- Updated `ChatTopBar.tsx` with Dashboard nav button

### Infrastructure
- Telemetry schema designed for `session_telemetry` table (pending DB migration)
- Top 5 patterns identified across 3 high-complexity VPS sessions
- 5 prompt/hook injections recommended for agent orchestration improvement

---

## [Phase 4 P0+P1] — 2026-05-31 04:46 UTC

### Added
- **4 Claude Code-style tool UI cards**: FindingCard, ActionCard, CommandCard, FileDiffCard
- **SSE event taxonomy** in `structured_models.py` with pydantic validation
- **Multi-tab artifact store** (tabs[], pinnedIds[], activeTabId, mode)
- **11 canvas tools** in `canvas-tools.ts` (agent-callable via thread.tsx)
- **3 self-knowledge skills**: `jarvis-os-self-knowledge`, `canvas-mastery`, `runtime-introspection`
- **Keyboard shortcuts**: Cmd+\\, Cmd+Shift+\\, Cmd+E, [, ], Esc
- `useAssistantInstructions` extended with canvas + self-knowledge context

### Fixed
- ArtifactPanel tab bar, fullscreen support, tab switching

---

## [Phase 3 P0] — 2026-05-31 03:00 UTC

### Added
- **5 assistant-ui hooks**: `useAssistantInstructions`, `makeAssistantVisible`, `CompositeAttachmentAdapter`, `RequestApprovalToolUI`, `MissionSummaryDataUI`
- `attachment-adapters.ts` — image+text composite for DeepSeek V4 Pro vision
- Runtime correction: `useLocalRuntime` canonical pattern (NOT Vercel AI SDK)

---

## [Phase 2+3+4 Mega-Migration] — 2026-05-26

### Added
- **ExternalStoreRuntime** canonical pattern (zustand + 4 handlers)
- Multi-model selector (DeepSeek V4 Pro / Kimi K2.6 / Claude Sonnet)
- Retry/cancel/auth/empty-detection in chat
- Multi-tab sync + rapid-send queue + context-trim
- **Spatial Glass Nervous System** design language

### Changed
- Orchestrator default: Kimi K2.6 → DeepSeek V4 Pro
- 4 cardinal skills locked: cloudflare-resilience, mission-prompt-hardening, manual-recovery, notebooklm-mcp

---

## [Scope Discipline Crash Fix] — 2026-05-27

### Fixed
- `ArtifactAwareText.tsx` — removed invalid `useAuiState(s => s.part.text)` access
- Combined `{...part}` spread + explicit prop flow pattern
- Hardened `assistant-ui-scope-discipline.md` skill to v2

---

## [Aurora Glass Design] — 2026-05-30

### Added
- Aurora glass aesthetic: `bg-zinc-900/40 backdrop-blur-md border-zinc-800/50`
- Design system for billing components
- Zero-layout-shift theme system (6+ visual identities)

---

## [Slots Fix] — 2026-05-31 05:07 UTC

### Fixed
- `__slots__` handling in jarvis-runtime.tsx SSE event processing
- Session smoke test confirming all tools + MCP connectivity

---

## [MVP Sandbox Pipeline] — 2026-05-30

### Added
- `mvp-builder` service (VPS port 8200) — Kimi K2.6 plan → DeepSeek V4 Pro generate
- `/sandbox/[slug]` route on Vercel
- `/api/mvp/new`, `/api/mvp/[slug]`, `/api/mvp/list` API routes
- `GenerativeMvpCard` + SSE streaming for build progress
