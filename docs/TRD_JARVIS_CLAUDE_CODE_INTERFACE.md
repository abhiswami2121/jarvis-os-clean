# TRD — Jarvis OS Refresh-Crash Fix + Canvas/Deploy

**Pairs with:** PRD_JARVIS_CLAUDE_CODE_INTERFACE.md

---

## 1. Architecture Overview

```
VPS agent (claude-agent-api)  --stream-->  jarvis-runtime.tsx (ChatModelAdapter)
        |                                         |
        |                                   AssistantRuntimeProvider
        |                                         |
   conversation store                     Thread (live render path)
        |                                    /            \
   useConversationReplay              GroupedParts      Parts(fallback)
        |                              (JarvisText)      <-- REMOVE bare
   ConversationHydrator                                     scope re-entry
   (HistoryMarkdown — scope-free)
```

Two render paths exist: (a) LIVE streaming via Thread/Parts, (b) HISTORY replay
via ConversationHydrator. The crash happens when path (b) — or a refreshed (a) —
hits a component that reads assistant-ui scope.

## 2. Fix Set (Phase 1)

### T1 — Scope-free Text part (DONE on disk, verify)
- File: components/artifacts/ArtifactAwareText.tsx
- Change: drop MarkdownTextPrimitive; accept `text` prop; render HistoryMarkdown
  + ArtifactList from parseArtifacts(text). No assistant-ui hooks.

### T2 — JarvisText is the only Text mapping
- File: components/assistant-ui/thread.tsx
- thread maps Text: (props) => <JarvisText {...props} /> (L491). JarvisText
  (JarvisMessageRenderer.tsx L464) already destructures {text} → scope-free. Keep.

### T3 — Remove the bare fallback Parts re-entry
- File: components/assistant-ui/thread.tsx L556
- The bare `<MessagePrimitive.Parts />` fallback re-enters default part renderers
  (MarkdownTextPrimitive) and can crash. Replace with the same GroupedParts +
  components map used above, wrapped in MessagePartsBoundary, OR delete if the
  grouped path already covers all messages.

### T4 — MessagePartsBoundary = pure ErrorBoundary
- File: components/assistant-ui/MessagePartsBoundary.tsx
- MUST be a React class ErrorBoundary (getDerivedStateFromError). It may NOT
  call useAuiState at the top level (that itself crashes on refresh). If it needs
  part data, receive via props. Fallback UI: small "This message couldn't render
  — reload" card, never a white screen.

### T5 — markdown-text.tsx isolation
- File: components/assistant-ui/markdown-text.tsx
- Keep MarkdownText (LIVE path only). Ensure it is NEVER imported by any
  history/replay component. Add a header comment documenting the constraint.

## 3. Build & Deploy Pipeline (Phase 1 gate)

PER docs/vercel-deploy rules (commit-author gate):
1. `rm -rf .next && npm run build` — MUST exit 0. Capture errors; fix; repeat.
2. `git add -A && git commit -m "..."` (author already configured).
3. Hide .git, deploy prebuilt via vercelProxy createDeployment (or CLI), restore .git.
4. Verify state==READY via vercelProxy getDeployment; confirm commitSha==HEAD.
5. promoteToProd if needed.

## 4. Canvas / Deploy-from-Canvas (Phase 2)

- Canvas component reads artifacts from parseArtifacts (already on disk).
- Code tab: Shiki highlight (shiki already a dep).
- Deploy tab: calls vercelProxy createDeployment with the artifact files;
  streams build state; renders READY url or getBuildLogs on failure.
- Artifact chip onClick → open Canvas at that artifact id (event bus already
  used via window dispatch in jarvis-runtime).

## 5. Test Plan

- TP1: load /?cid=<existing> with markdown+code+artifacts → no crash (AC1).
- TP2: grep guard — CI grep that fails if a *History*/*Hydrator*/*Replay* file
  imports useAuiState/MarkdownTextPrimitive.
- TP3: build gate — `next build` exit 0 (AC3).
- TP4: post-deploy — getDeployment.state==READY && meta.commitSha==HEAD (AC4).

## 6. Rollback

- .bak files already exist (thread.tsx.bak, ChatAurora.tsx.bak). Keep until
  AC1–AC5 pass in prod, then remove.
