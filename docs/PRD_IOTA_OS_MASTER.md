# Iota OS — Master PRD & Orchestration Reference

> **Status:** Living document · **Owner:** Hermès/Jarvis orchestrator · **Build:** `jarvis-os-clean` (Next.js App Router, pnpm, Vercel)
> **Canonical URL:** https://jarvis-os-clean.vercel.app · **Repo:** `/home/hermes/repos/jarvis-os-clean` (no git remote — deploy via Vercel CLI)
> **Last consolidated:** 2026-05-29 — merges the V2 Generative-OS plans with the real `assistant-ui` UI layer now on disk.

---

## 0. Why this document exists

We developed a large body of plans for the Generative OS and ended up shipping them onto the **Base44 V2** surface (`/command-center`, `CommandCenterV2`). That work is real and good — but the **canonical iota build lives here**, on the standalone Next.js app deployed to Vercel, built on top of **assistant-ui** + a custom **inline artifact** + **canvas** layer.

This PRD does three things:
1. **Re-states** the V2 plans now that we understand how the assistant-ui UI layer actually fits.
2. **Merges** them with what is already built on disk (Tier-1 inline artifacts, thread, canvas).
3. **Lives on disk** (`docs/`) so the orchestrator can reference it on every run — it IS part of the orchestration loop.

---

## 1. Ground truth — what is already on disk

**App Router (`src/app/`)**
- `chat/[id]/page.tsx` — primary conversation surface (assistant-ui Thread)
- `documents/[id]/page.tsx` — artifact/document viewer
- `api/`: `agent`, `chat`, `conversations`, `jarvis-proxy` (+ `files`, `resume`), `runtimes`, `system/pulse`, `version`, `vps-files`

**UI layer (`src/components/`)**
- `assistant-ui/` — `thread.tsx`, `markdown-text.tsx`, `inline-artifact-card.tsx`, `tool-group.tsx`, `tool-fallback.tsx`, `reasoning.tsx`, `attachment.tsx`, `tooltip-icon-button.tsx`
- `artifacts/` — `ArtifactRouter`, `ArtifactAwareText`, `DataTableArtifact`, `StatusCardArtifact`, `ChartArtifact`, `ActionPanelArtifact`, `ActionButton`, `SlackCanvasArtifact`, `ErrorRecoveryArtifact`, `LiquidErrorCard`
- `canvas/` (+ `templates/`), `cards/`, `chat/`, `dashboard/`, `drawer/`, `jarvis/`, `shared/`, `ui/`
- `lib/artifacts/` — `types.ts` (Zod), `parser.ts`; `lib/stores/`, `hooks/`

**Contract already proven:** VPS agent emits \`[[ARTIFACT_START:type]]...[[ARTIFACT_END]]\` blocks → \`ArtifactAwareText\` detects + Zod-validates → \`ArtifactRouter\` renders the typed component inline in the thread.

---
## 2. North Star

Iota chat is a **first-class builder environment**, not a chatbot. Every turn should be:
- **Truthful** — the UI never claims work happened that didn't; streaming state reflects the real VPS job.
- **Discoverable** — the user can see what iota can do (capabilities, slash commands, runtimes) without reading docs.
- **Actionable** — structured output renders as interactive artifacts (tables, cards, charts, action panels), not walls of text.
- **Deployable** — anything iota builds (HTML, landing pages, code) can go live in one click, with a durable receipt.
- **Self-aware** — iota maintains its own memory of what it built and how it works, and references it on every run.

---

## 3. The four interaction phases (V2 plan → mapped to this build)

### Phase A — Truthful streaming & run status
The thread must show real execution state from the VPS job, not a fake spinner.
- **Source of truth:** `api/jarvis-proxy` job status (`queued|running|completed|failed`) + `api/system/pulse`.
- **UI:** a run-status pill in `thread.tsx` driven by polling `jarvis-proxy/resume`; tool calls render via `tool-group.tsx` / `tool-fallback.tsx` with live status.
- **Rule:** never render "done" until the job is terminal. On `failed`, surface `ErrorRecoveryArtifact` / `LiquidErrorCard`.

### Phase B — Capability discovery
User can see what iota can do, inline.
- **Runtimes:** `api/runtimes` lists available agent runtimes (Claude SDK, Kimi Code).
- **Slash commands:** a discoverable menu in the composer (`/build`, `/research`, `/deploy`, `/speckit`).
- **UI:** a discovery panel/drawer (`components/drawer/`) listing runtimes + commands + health (`system/pulse`).

### Phase C — Inline artifacts (TIER 1 — BUILT)
Structured AI output renders as typed React components inside the thread.
- **Contract:** \`[[ARTIFACT_START:type]]{json}[[ARTIFACT_END]]\`
- **Pipeline:** `ArtifactAwareText` (detect) → `lib/artifacts/parser.ts` (extract) → Zod `types.ts` (validate) → `ArtifactRouter` (route) → typed component.
- **Components built:** DataTable, StatusCard, Chart, ActionPanel, ActionButton, SlackCanvas, ErrorRecovery, LiquidError.
- **Mounting fix (2026-05-29):** assistant-ui 0.14.7 tool rendering uses `tools: { Override }` — NOT a top-level `ToolCall:` key. The wrong shape mounts the default renderer without part-scope and crashes the thread ("no 'part' property"). Locked in `thread.tsx`.

### Phase D — Canvas overlay & deploy (TIER 2/3)
Large artifacts (HTML mini-apps, docs, code) open in a split **canvas** beside the thread.
- **UI:** `components/canvas/` (+ `templates/`) — slide-in side panel, preview ↔ code toggle.
- **Deploy:** HTML/landing artifacts → Vercel via the deploy proxy; code artifacts → apply to repo. Every deploy writes a **receipt** (url, sha, timestamp, status) persisted on the artifact + mirrored to `documents/[id]`.
- **Doc viewer:** `app/documents/[id]` renders a saved artifact as a standalone shareable page.

---

## 4. Artifact tiers (canonical taxonomy)

| Tier | Kind | Surface | Status |
|------|------|---------|--------|
| 1 | data_table, status_card, chart, action_panel | Inline in thread | ✅ Built |
| 1 | slack_canvas, error_recovery | Inline in thread | ✅ Built |
| 2 | code (ts/tsx/py/sql) | Canvas overlay + Deploy→repo | 🔨 Wire deploy |
| 3 | html mini-app, document, diagram | Canvas overlay + Deploy→Vercel | 🔨 Wire deploy |
| 4 | data (raw tool payloads) | Collapsed by default | Backlog |

---
## 5. Self-orchestration loop (how iota owns this build)

Iota maintains and references its own operating knowledge on every run. This doc + `ARTIFACTS.md` ARE that memory.

**The autonomous loop (no human, no Base44 preview required):**
1. **READ** — line-ranged reads via the VPS bridge (`awk`/`sed`); verify library contracts from `node_modules/**/*.d.ts`.
2. **PLAN** — consult this PRD + `ARTIFACTS.md` for taxonomy, contracts, and the locked assistant-ui mounting rule.
3. **PATCH** — edit `src/**` with a timestamped `.bak` first (e.g. `*.bak.<epoch>_<reason>`).
4. **BUILD** — `pnpm build` (or `npx next build`); never deploy a red build.
5. **DEPLOY** — `vercel deploy --prod --yes --token $VERCEL_TOKEN` (no git remote; Vercel CLI is the deploy path).
6. **VERIFY** — `vercel ls`, `vercel inspect`, `curl` the live route (401 = Vercel SSO gate = healthy, not a crash).
7. **RECORD** — append outcomes/decisions back into `docs/` so the next run inherits the context.

**Deploy facts (locked):**
- Project `jarvis-os-clean` · canonical alias `jarvis-os-clean.vercel.app` (auto-updates on prod deploy).
- Builds in ~30–40s; static + dynamic routes per `src/app`.
- Secrets live in `.env.production` + Vercel env; do not hardcode.

---

## 6. Phased roadmap

### ✅ Phase 0 — Stabilize (DONE 2026-05-29)
- Conversation UI crash fixed (assistant-ui `tools.Override` contract in `thread.tsx`).
- Deployed to prod, verified Ready.

### Phase 1 — Truthful streaming (Phase A)
- Run-status pill in `thread.tsx` bound to `jarvis-proxy` job lifecycle.
- Terminal-state gating; `failed` → ErrorRecovery artifact.
- **Accept:** UI status always matches real job state; no premature "done".

### Phase 2 — Capability discovery (Phase B)
- Discovery drawer: runtimes (`api/runtimes`) + slash commands + `system/pulse` health.
- Composer slash menu.
- **Accept:** user can list every capability without leaving chat.

### Phase 3 — Canvas + deploy (Phase D)
- Wire `components/canvas` deploy actions: HTML→Vercel, code→repo, each with a persisted receipt.
- `documents/[id]` renders saved artifacts as shareable pages.
- **Accept:** build an HTML artifact → one-click deploy → live URL + receipt on the artifact.

### Phase 4 — Artifact depth
- Tier-4 collapsed raw payloads; richer chart rendering; diff view for code artifacts.

---

## 7. Invariants (do not break)

1. assistant-ui tool rendering = `tools: { Override }`. Never a top-level `ToolCall:` key.
2. Artifact contract = \`[[ARTIFACT_START:type]]{json}[[ARTIFACT_END]]\`, Zod-validated in `lib/artifacts/types.ts`.
3. Never deploy a failing build.
4. Every edit gets a `.bak` first.
5. This doc is the merge point — update it when plans change so V2 and iota never drift again.

---

*Merged from the V2 Generative-OS PRD set (artifacts canvas, generative OS production, deploy) + on-disk ARTIFACTS.md. This is the single source of truth for the iota build.*
