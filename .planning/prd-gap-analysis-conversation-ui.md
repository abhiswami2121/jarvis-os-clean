# PRD Gap Analysis: Production-Grade Conversation Management UI

**Date:** 2026-06-03  
**Scope:** Research Assistant UI — `/chat/[id]` page and all conversation components  
**Repo:** `jarvis-os-clean` (Next.js 15 + assistant-ui React)

---

## 1. Current State: Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    chat/[id]/page.tsx                             │
│                                                                   │
│  ┌─────────────────────┐  ┌────────────────────────────────────┐ │
│  │ ChatSidebar          │  │ main                               │ │
│  │ (conversation list)  │  │                                    │ │
│  │                      │  │  ┌──────────────────────────────┐  │ │
│  │ useConversationList  │  │  │ ConversationHydrator         │  │ │
│  │ (15s polling)        │  │  │ ─────────────────────────────│  │ │
│  │                      │  │  │ • useConversationReplay(cid) │  │ │
│  │                      │  │  │ • Renders MessageBubble      │  │ │
│  │                      │  │  │   with HistoryMarkdown       │  │ │
│  │                      │  │  │ • Own styling (dark-glass)   │  │ │
│  │                      │  │  │ • "Live below" divider       │  │ │
│  │                      │  │  └──────────────────────────────┘  │ │
│  │                      │  │                                    │ │
│  │                      │  │  ┌──────────────────────────────┐  │ │
│  │                      │  │  │ Thread (assistant-ui)         │  │ │
│  │                      │  │  │ ─────────────────────────────│  │ │
│  │                      │  │  │ • ThreadWelcome when empty   │  │ │
│  │                      │  │  │   "How can I help you today?"│  │ │
│  │                      │  │  │ • ThreadPrimitive.Messages   │  │ │
│  │                      │  │  │ • JarvisReasoning / ToolCards│  │ │
│  │                      │  │  │ • Composer at bottom         │  │ │
│  │                      │  │  └──────────────────────────────┘  │ │
│  │                      │  │                                    │ │
│  └─────────────────────┘  └────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

        ⚠️ TWO PARALLEL RENDER PATHS = "DOUBLE UI" BUG
```

**The Critical Gap:** `ConversationHydrator` renders history using its OWN component set (MessageBubble, HistoryMarkdown, HistoryToolChip) while `Thread` renders live messages using assistant-ui's native components. On refresh, history messages look different from the same messages when they were live. **This is the "double UI" the user is seeing.**

Additionally, `Thread` always initializes with `initialMessages: []` — so `s.thread.isEmpty` is ALWAYS true, showing "How can I help you today?" even on conversations with hundreds of messages.

---

## 2. Gap-by-Gap Analysis

### GAP #1 [CRITICAL]: History not seeded into Thread — "How can I help you today?" on active chats

| Field | Detail |
|-------|--------|
| **Current behavior** | `JarvisRuntimeProvider` is called WITHOUT `initialMessages`. The Thread always starts empty. `ThreadWelcome` renders "Hello there! How can I help you today?" unconditionally on every conversation, even those with 200+ messages. |
| **Expected behavior** | When navigating to `/chat/{cid}`, history messages should populate the Thread's message list. `ThreadWelcome` should ONLY show on truly new conversations (0 messages). |
| **Root cause** | `hydrate-initial-messages.ts` contains `toThreadMessages()` — a pure function that converts `HydratedMessage[]` → `ThreadMessageLike[]`. This file was written EXPLICITLY to fix this bug (see its comment: "BUG B FIX — ONE RENDERER"). But the page NEVER calls it. The import exists on `page.tsx` line 18 but is UNUSED. |
| **Fix complexity** | LOW — the bridge function exists, it just needs to be wired up. |
| **Files to touch** | `page.tsx`, possibly `jarvis-runtime.tsx` |

### GAP #2 [CRITICAL]: Double render path — history vs live styling divergence

| Field | Detail |
|-------|--------|
| **Current behavior** | History renders through `ConversationHydrator` → `MessageBubble` → `AssistantParts` → `HistoryMarkdown` / `HistoryArtifactAwareText`. Live messages render through `Thread` → `ThreadMessage` → `AssistantMessage` → `JarvisText` / `JarvisReasoning` / `ToolCallCard`. These use COMPLETELY DIFFERENT component trees with different styling. |
| **Expected behavior** | ONE render path. History messages are seeded as `initialMessages` into `useLocalRuntime()`, making them part of the Thread's native message list. The same `AssistantMessage` component renders them identically to live messages. |
| **Root cause** | `ConversationHydrator` was built as a SEPARATE history renderer above the Thread instead of seeding into the Thread. The `hydrate-initial-messages.ts` bridge was created to fix this but never wired. |
| **Fix complexity** | MEDIUM — requires coord between ConversationHydrator and page. |
| **Files to touch** | `page.tsx`, `ConversationHydrator.tsx` |

### GAP #3 [MEDIUM]: Three conflicting greeting/welcome components (dead code)

| Component | Location | Lines | Rendered? |
|-----------|----------|-------|-----------|
| `ThreadWelcome` | `thread.tsx` lines 204-220 | 17 | YES — inside Thread when empty |
| `ChatGreeting` | `ChatGreeting.tsx` | 67 | NO — never imported |
| `Hero` | `hero.tsx` | 51 | NO — never imported |

**Impact:** Dead code clutter. Confusion about which greeting is canonical. ChatGreeting says "What can I run for you?" while ThreadWelcome says "How can I help you today?" — different branding. If either dead component is accidentally imported, it creates a 3-way UI collision.

### GAP #4 [MEDIUM]: JarvisChatPanel — orphaned parallel chat implementation

| Field | Detail |
|-------|--------|
| **Location** | `src/components/chat/JarvisChatPanel.tsx` — 229 lines |
| **Status** | NEVER imported. Complete independent chat implementation with its own SSE streaming, localStorage persistence, and sidebar state. |
| **Risk** | Maintenance confusion. A developer might import this thinking it's the canonical chat panel. |
| **Action** | Remove or archive. |

### GAP #5 [LOW]: Conversation list — missing production features

| Missing Feature | Impact |
|----------------|--------|
| Search/filter conversations | Can't find old chats |
| Delete conversation | Can't clean up test chats |
| Rename conversation | All chats show "New chat" or raw IDs |
| Conversation grouping (today/yesterday/older) | Flat list, hard to scan |
| Unread indicators | No way to see which chats have new messages |
| Pin/star conversations | Can't bookmark important chats |
| Keyboard navigation (Escape to close, arrows to navigate) | Mouse-only sidebar |
| Click-outside-to-close sidebar | Only X button closes it |
| Empty state for conversation list | Shows loading skeleton even when truly empty |

### GAP #6 [LOW]: Error boundary redundancy

| Location | Wrapping |
|----------|----------|
| `chat/layout.tsx` | Wraps ALL `/chat/*` pages in `JarvisErrorBoundary` |
| `chat/[id]/page.tsx` line 43 | Wraps entire page in `JarvisErrorBoundary` |
| `chat/[id]/page.tsx` line 76 | Wraps `Thread` in `JarvisErrorBoundary` |

Thread is inside **3 error boundaries**. Not harmful but redundant.

### GAP #7 [LOW]: Double try-catch in JarvisAdapter.applyEvent

| Location | `jarvis-runtime.tsx` lines 257-422 |
|----------|-------------------------------------|
| **Issue** | Nested try-catch blocks both catch generic `Error`, both increment separate error counters. A single throwing line can fire TWO terminal error messages if both thresholds are hit simultaneously. |

---

## 3. Production-Grade Target Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    chat/[id]/page.tsx                             │
│                                                                   │
│  ┌─────────────────────┐  ┌────────────────────────────────────┐ │
│  │ ChatSidebar          │  │ main                               │ │
│  │ ─────────────────── │  │                                    │ │
│  │ • Search/filter      │  │  ┌──────────────────────────────┐  │ │
│  │ • Grouped (today/    │  │  │ Thread (assistant-ui)         │  │ │
│  │   yesterday/older)   │  │  │ ─────────────────────────────│  │ │
│  │ • Delete/rename      │  │  │ • ThreadWelcome ONLY when    │  │ │
│  │ • Pin/star           │  │  │   history.length === 0 AND   │  │ │
│  │ • Unread indicators  │  │  │   thread is empty            │  │ │
│  │ • Escape to close    │  │  │ • UserMessage (same as live) │  │ │
│  │ • Click-outside      │  │  │ • AssistantMessage (same!)   │  │ │
│  │ • Keyboard nav       │  │  │ • ToolCallCard (same!)       │  │ │
│  │                      │  │  │ • Composer at bottom         │  │ │
│  │                      │  │  │                              │  │ │
│  │                      │  │  │ ALL messages — history AND   │  │ │
│  │                      │  │  │ live — use ONE render path   │  │ │
│  │                      │  │  └──────────────────────────────┘  │ │
│  └─────────────────────┘  └────────────────────────────────────┘ │
│                                                                   │
│  ConversationHydrator (reduced role):                             │
│    • Fetches history via useConversationReplay(cid)               │
│    • Converts via toThreadMessages()                              │
│    • Passes as initialMessages to JarvisRuntimeProvider           │
│    • Renders NOTHING visible (zero-height data component)         │
│    • Handles: "Load earlier" → prepend to initialMessages         │
│    • Handles: "Resuming stream" indicator (subtle banner)         │
└──────────────────────────────────────────────────────────────────┘

         ✅ ONE RENDER PATH = UNIFIED UI, NO GREETING BUG
```

---

## 4. Implementation Plan (Methodical Fix Order)

### Phase 1: Critical Bug Fixes (immediate — fixes the "How can I help you today?" and double UI)

**Step 1.1: Wire up initialMessages in the page**
- In `chat/[id]/page.tsx`, add `useConversationReplay(cid)` at the page level
- Convert result via `toThreadMessages()` (already imported, line 18)
- Pass to `<JarvisRuntimeProvider initialMessages={threadMessages}>`
- Remove the separate `<ConversationHydrator>` rendering (or reduce it to a passthrough)

**Step 1.2: Make ThreadWelcome conditional on actual emptiness**
- In `thread.tsx` line 145, change the condition from `s.thread.isEmpty` to a check that accounts for whether initialMessages were provided. This may require passing a prop or using a context value to indicate "this conversation has history."

**Step 1.3: Keep ConversationHydrator for pagination**
- `ConversationHydrator` still handles "Load earlier messages" pagination
- It should become a *data component* (no visible UI except the "Load earlier" button)
- Its fetched messages get prepended to the Thread's message list

### Phase 2: Dead Code Cleanup

- Remove `ChatGreeting.tsx` (67 lines, never imported)
- Remove `hero.tsx` (51 lines, never imported)  
- Remove `JarvisChatPanel.tsx` (229 lines, never imported)
- Remove redundant error boundaries (keep outermost only)

### Phase 3: Conversation List Production Features

- Add search/filter input
- Group conversations by time period
- Add delete/rename capabilities
- Add Escape key and click-outside-to-close
- Add empty state for truly empty conversation list

### Phase 4: Edge Case Hardening

- Fix double try-catch in `applyEvent` (jarvis-runtime.tsx)
- Handle race condition: thread messages arrive while history is still loading
- Handle streaming resume edge case: history shows "running" tool, live stream continues it
- Handle very large conversations (500+ messages) without performance degradation
- Add proper loading skeletons for initial history hydration

---

## 5. Success Criteria

| # | Criterion | How to verify |
|---|-----------|---------------|
| 1 | Navigating to an existing conversation shows history inline, NOT "How can I help you today?" | Open `/chat/any-existing-conv` |
| 2 | History messages look identical to live messages — same styling, same components | Compare a refreshed page to live streaming |
| 3 | ThreadWelcome ONLY appears on truly new conversations (0 messages) | Open a brand-new `/chat/` redirect |
| 4 | No dead greeting/welcome components exist in the import tree | Grep for ChatGreeting, Hero imports |
| 5 | Conversation list supports search, delete, rename | Verify in sidebar |
| 6 | Sidebar closes on Escape key and click-outside | Keyboard + mouse test |
| 7 | "Load earlier" pagination works without visual glitches | Test on conversation with 100+ messages |
| 8 | No double UI — exactly ONE rendering path for all messages | Visual inspection on refresh |
