# PRD — Jarvis OS → Claude-Code-Style Streaming + Canvas + Vercel Deploy

**Status:** Approved for build
**Owner:** Hermès (operator: Abhi)
**Date:** 2026-05-30
**Repo:** /home/hermes/repos/jarvis-os-clean (Next 16.2.6, assistant-ui 0.14.7)

---

## 1. Problem Statement

The Jarvis OS chat UI crashes on page refresh. When an existing conversation is
reloaded, components fail to mount and the thread white-screens. Separately, the
live Vercel production site does NOT reflect any recent work — it is serving an
old build. The operator wants a Claude-Code-style experience: a chat stream from
the VPS agent, a Canvas to view generated code/artifacts, and one-click deploy
to Vercel — with zero crash regressions.

## 2. Root-Cause Findings (blood test)

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| F1 | Live Vercel prod is the FIRST commit (b905de3 "init") | vercelProxy listDeployments | CRITICAL |
| F2 | ~all recent work is uncommitted (6 modified, 4 untracked) | git status | CRITICAL |
| F3 | Refresh crash: MarkdownTextPrimitive + useAuiState render outside live part scope during history replay → "current scope does not have a part property" | markdown-text.tsx, thread.tsx L556 | CRITICAL |
| F4 | ArtifactAwareText fixed on disk (uses HistoryMarkdown prop) but never deployed | git status (modified) | HIGH |
| F5 | thread.tsx still renders bare <MessagePrimitive.Parts /> (L556) as a fallback path that re-enters scope hooks | thread.tsx | HIGH |
| F6 | MessagePartsBoundary (new) wraps grouped parts but itself imports useAuiState — must be a pure error boundary, not a scope reader | MessagePartsBoundary.tsx | MEDIUM |

## 3. Crash Surface — Components That Can Go Bad on Refresh

Any component that calls an assistant-ui scope hook (useAuiState / useAui /
useMessagePart / useContentPart / MarkdownTextPrimitive / useIsMarkdownCodeBlock)
WILL throw when rendered outside a live Thread message-part context (i.e. during
history hydration / SSR / refresh). Inventory:

- markdown-text.tsx — MarkdownTextPrimitive, useIsMarkdownCodeBlock (LIVE CRASH)
- attachment.tsx — useAuiState, useAui (×4)
- reasoning.tsx — useAuiState (×2)
- thread.tsx — useAuiState; bare <MessagePrimitive.Parts/>
- tool-group.tsx / inline-artifact-card.tsx — safe (prop-driven, documented)

**Rule going forward:** history/replay render paths MUST use prop-driven,
scope-free components (HistoryMarkdown, JarvisText({text}), ArtifactAwareText({text})).

## 4. Goals

G1. Zero crash on refresh / history replay / direct conversation deep-link.
G2. Claude-Code-style Canvas: view any code/artifact streamed from the VPS agent.
G3. Stream agent output from VPS into the chat in real time.
G4. One-click "Deploy to Vercel" from the Canvas, with pre-deploy build gate.
G5. CI safety: no deploy may go live unless `next build` passes clean.

## 5. Non-Goals

- Re-coding the VPS agent runtime itself (out of scope this pass).
- New auth model. Existing operator gate stays.

## 6. UX Requirements

U1. Split layout: left = chat stream, right = Canvas (collapsible).
U2. Canvas tabs: Code (syntax-highlighted), Preview, Diff, Deploy.
U3. Artifact chips in chat open the Canvas to that artifact.
U4. Deploy button shows: building → deployed (with URL) → or build-failed (logs).
U5. Refresh restores the same conversation + canvas state from the stable cid.

## 7. Acceptance Criteria

AC1. Reload a conversation with markdown + code + artifacts → renders, no crash.
AC2. grep shows NO scope hooks on any history-replay path.
AC3. `next build` exits 0 before any deploy is triggered.
AC4. New Vercel prod deploy SHA == latest main HEAD (not b905de3).
AC5. Canvas opens generated code and Deploy returns a READY Vercel URL.

## 8. Rollout

Phase 1 (this pass): F2/F3/F4/F5/F6 fixes → commit → build gate → deploy.
Phase 2: Canvas streaming polish + Deploy-from-Canvas wiring.
Phase 3: VPS-side streaming contract hardening.
