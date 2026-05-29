# PRD — Iota Code-Graph + Modular Agent Orchestration OS Foundation

Status: Planning -> Implementation. Canonical build: /home/hermes/repos/jarvis-os-clean (Vercel Iota OS, Next.js app-router). Updated 2026-05-29.
Source of truth mirrored in Base44 docs/ and here. Any agent (Claude SDK, Kimi, sub-agents) MUST read this before touching the code-graph or orchestration layers.

## North Star
1. Live code knowledge-graph of own repo -> query graph (cheap/fast) instead of blind file reads (expensive tokens).
2. Modular agent orchestration: full ship loop (plan->code->deploy) OR plan-only OR code-only, composing one organized foundation of agents/sub-agents/skills/tools/schemas.
3. Clean menu-accessible UI expanding to a full wiki-graph dashboard: which agent/sub-agent runs what, plus organized view of own files/skills/orchestrations/media = proof of self-organization.

## Exists already (build ON, do not rebuild)
- VPS sdk-ingester :8112 — graphify.py (VendorGraph concept graph), conversation_graph.py (CCG), server.py (/v1/graph,/v1/ccg/*,/v1/ingest/*), auth X-Hermes-Token.
- Base44 mirror: ContextGraphNode entity + functions/contextGraphBridge.
- Iota app: src/app/chat/[id]/page.tsx, src/app/api/{conversations,jarvis-proxy,agent,runtimes,chat,system,vps-files}, ChatSidebar/ChatTopBar/top-bar/ConversationHydrator. Claude Agent SDK v0.1.81.
- In flight: Fix A (idle 10min + 15s heartbeat) shipped; Fix B (hydrator restyle to aurora-glass) pending.

## Two graph engines (both, bulletproof, agents aware)
### Graphify (CODE graph) — new vps/sdk-ingester/code_graphify.py, namespace repo_code
- Walk src/ (+vps/,functions/ optional). Node=file path; edges=resolved import/from (relative + @/ alias). Mine exports as metadata. Weights: import 1.0, type-only 0.5, sibling 0.2. sha256 per file.
- Live feed: mtime+sha256 incremental reindex; stats expose last_indexed_at, files_indexed, stale_count, dirty_files, freshness (live<5m / recent<1h / stale>1h).
- Endpoints: POST /v1/code/index; GET /v1/code/graph; /v1/code/file?path; /v1/code/search?q; /v1/code/stats; /v1/code/dependents?path.
### Graphiti (TEMPORAL kg) — new vps/sdk-ingester/graphiti_bridge.py (getzep/graphiti)
- Lazy import; if missing/unconfigured return {available:false,reason} — never crash service. Backend: try Supabase (SUPABASE_URL/KEY) else local. Episodes = agent runs/PRD decisions/ship events. First deliverable = health/probe endpoint surfaced in UI; full ingest after probe green.
- Endpoints: GET /v1/graphiti/health; POST /v1/graphiti/episode; GET /v1/graphiti/search?q.
### Agent awareness
- Tools: code_graph_search, code_graph_file, code_graph_dependents, graphiti_search. System prompt: query code graph before reading files. One Base44 bridge iotaGraphBridge proxies all + mirrors freshness.

## Modular orchestration
Modes: full_ship(plan->code->review->deploy->verify), plan_only, code_only, review_only, research. Orchestrator sequences stages; each stage = role(orchestrator/worker/validator) on a runtime (Claude SDK default).
Foundation objects: agents, sub-agents, skills, tools, schemas — organized inspectable registry src/lib/agent-os/registry.ts mirrored for UI. This registry IS the proof of organization.
Live run events: {runId,mode,agent,subAgent,stage,status,tool,ts} persisted -> UI shows realtime who-runs-what.

## Iota OS UI
Menu item Iota OS (brain/graph icon) in ChatTopBar/top-bar/sidebar -> panel -> expands to /os route.
/os tabs: 1 Orchestration (live agent/sub-agent tree + timeline) 2 Skills/Tools/Schemas browser 3 Code Graph (interactive deps view, freshness badge, search reads right file) 4 Knowledge/Graphiti (temporal feed + health) 5 Files/Media (wiki-graph of itself).
UX: clean, menu-accessible, panel->full page, freshness ALWAYS visible, read-only first then add controls.

## Phases
P0 PRD on disk (Base44+VPS) + graph node. P1 code_graphify + /v1/code/*. P2 iotaGraphBridge. P3 graphiti probe. P4 agent tools+prompt. P5 agent-os/registry + run events + modes. P6 /os UI 5 sections. P7 self-graph (index PRD+registry). Each phase: build->deploy->verify live->check off.

## Guardrails
Build ON existing graphify/CCG/contextGraphBridge. Graphiti optional, degrade gracefully. Freshness truthful. One Base44 auth surface. Modular (never force full loop). Don't regress Fix A/Fix B.

## Open questions
Graphiti backend Supabase vs local (P3). Code graph cover functions/ too? (default Iota src first). /os full route vs modal (default both).

## ADDENDUM (2026-05-29) — CHAT UX IS THE PRIORITY SURFACE
Operator #1 priority: the chat must be BEAUTIFUL, on par with Claude Code / Factory(Droid) / Cursor. Graph + orchestration are the efficiency engine UNDERNEATH; chat is the product. Build beautiful chat FIRST, then wire engine in.
Stack (confirmed, build on it, do NOT replace): @assistant-ui/react 0.14.7 + react-ai-sdk 1.3.26 + Vercel ai v6 + Next 16.2.6. UI: thread.tsx, markdown-text.tsx, reasoning.tsx, tool-fallback.tsx, tool-group.tsx, inline-artifact-card.tsx. Chrome: ChatAurora/ChatGreeting/ChatSidebar/ChatTopBar/top-bar/JarvisMessageRenderer/MarkdownViewer/ModelSelector/DocumentsMenu/ConversationHydrator. Agent loop: src/app/api/agent/route.ts (Claude Agent SDK). Transport: lib/jarvis-transport.ts, lib/jarvis-os-client.ts.
Acceptance (beautiful, Claude-Code-grade): 1) truthful live streaming + status line (thinking/reading/editing/running/deploying, never frozen spinner; Fix A heartbeat supports). 2) first-class tool cards not raw JSON (file diff chip, shell cmd+result, deploy receipt, web sources). 3) graceful collapsible reasoning. 4) inline artifacts + side canvas with copy/deploy. 5) calm premium aurora-glass across live AND history (Fix B), tasteful motion, mobile-clean. 6) self-orchestration visible-not-noisy: mini stage/sub-agent strip in chat that expands into /os dashboard. Chat stays hero; /os is deep-dive.
Sequencing: P-UX ships BEFORE heavy graph/orchestration backend (priority + lower risk). Graph/orchestration plug into the already-beautiful surface. Phase order now: P0 done -> P-UX (beautiful chat) -> P1 code graph -> P2 bridge -> P3 graphiti -> P4 agent tools -> P5 orchestration registry -> P6 /os UI -> P7 self-graph.

## VERIFIED EVENT CONTRACT + REAL GAP (read-the-code findings, 2026-05-29)
Next route api/agent/route.ts = PURE PASS-THROUGH (reader.read -> enqueue raw); only wraps system/session/conversation/done/error + keepalive. ALL rich events come from VPS claude-agent-api/server.py.
CANONICAL WIRE EVENTS (server.py state.push): text / text_delta{text}; reasoning{text} (thinking); tool_call{id,name,input}; tool_result{id,result,is_error}; checkpoint{checkpoint}; turn_complete; canvas_synthesis{slack_url,session_id,has_canvas,title,tool_call_id,method}; system{subtype,from,to,reason}; status{status:running|completed|cancelled|error,error?}; done. Plus inline [[ARTIFACT_START:type]]..[[ARTIFACT_END]].
REAL GAP = FRONTEND, not backend. Backend already streams tool_call/tool_result/reasoning/status. JarvisMessageRenderer.tsx (454L) already has tool-card primitives (statusMeta running/complete/incomplete + card icon+name+args+badge+result). P-UX work: (1) truthful status line from status + latest tool_call.name, clear on done; (2) ensure live tool_call/tool_result paired by id render via existing card (not flattened to text) + polish file-diff/shell/deploy/web variants; (3) Fix B: ConversationHydrator persist+replay tool_call/tool_result/reasoning so history == live; (4) mini orchestration strip from turn_complete/checkpoint/canvas_synthesis + missions-* swarm, expands to /os. NO new backend events needed for P-UX.
EXISTING ORCHESTRATION SWARM (do NOT duplicate): /home/hermes/services/missions-{orchestrator,api,worker-pool,validator,research-agent,workflow-agent,action-agent,vibecode-orchestrator,wiki-builder,report-agent}. This IS the plan->code->deploy + sub-agent foundation. P5/P6 wire UI to THIS. Map its event/status surface before /os Orchestration tab.
