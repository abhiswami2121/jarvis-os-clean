# Tier 1 Inline Artifact Rendering System

Built: May 26, 2026 · Stream 2A · jarvis-os-clean

## Overview

The Tier 1 artifact system renders AI-generated structured data as beautiful inline components within the chat thread, replacing plain markdown tables with interactive, type-aware React components.

### User Flow
1. User asks: "show me at-risk subscriptions"
2. VPS agent returns text containing `[[ARTIFACT_START:data_table]]...[[ARTIFACT_END]]` blocks
3. `ArtifactAwareText` detects the blocks, extracts validated JSON, renders clean markdown + artifact components
4. User sees gorgeous sortable data table with action buttons inline

## Architecture

```
src/
├── lib/artifacts/
│   ├── types.ts              # Zod schemas + TypeScript types
│   ├── parser.ts             # Block parser (detects [[ARTIFACT_START:type]]...[[ARTIFACT_END]])
│   └── test-fixtures.ts      # Sample artifacts for testing
└── components/artifacts/
    ├── ArtifactRouter.tsx     # Routes artifact type → component
    ├── ArtifactAwareText.tsx  # Wraps MarkdownTextPrimitive with artifact detection
    ├── DataTableArtifact.tsx  # Sortable tables with type-aware cell rendering
    ├── ActionButton.tsx       # 3-variant action buttons with confirm dialog
    ├── StatusCardArtifact.tsx # Metric grid cards with status + trends
    ├── ChartArtifact.tsx      # Line/bar/pie chart stubs with data tables
    └── ActionPanelArtifact.tsx# Severity-aware action panels
```

## Artifact Types

### 1. DataTableArtifact
Sortable columns, type-aware cells (currency → $1,234.56, status → colored badge), action bar, collapsible if >10 rows, 200-row cap.

```json
{
  "type": "data_table",
  "title": "At-Risk Subscriptions",
  "columns": [{"key": "customer", "label": "Customer", "type": "string"}],
  "rows": [{"customer": "Sarah Mitchell", ...}],
  "actions": [{"label": "Bulk Recovery", "intent": "bulk_recovery", "variant": "primary"}]
}
```

### 2. StatusCardArtifact
Grid of metric tiles with trend indicators (up/down/flat arrows).

### 3. ChartArtifact
Bar/line/pie chart stubs with inline data table fallback. Full chart library integration planned for Stream 2B.

### 4. ActionPanelArtifact
Severity-aware action panels (info/warning/critical) with description + action buttons.

## Block Format

Artifact blocks use double-bracket delimiters to avoid markdown link collision:

```
[[ARTIFACT_START:data_table]]
{JSON payload}
[[ARTIFACT_END]]
```

## Integration

`ArtifactAwareText` replaces `MarkdownText` in `thread.tsx` for text message parts. It:
1. Checks for artifact blocks (fast string check)
2. If blocks found: uses `MarkdownTextPrimitive` with `preprocess` prop to strip blocks
3. Renders artifacts via `ArtifactRouter` below the clean text
4. If no blocks: renders normal `MarkdownTextPrimitive` (zero overhead)

## How to Use from VPS Agent

When the VPS agent returns structured data, include it as an artifact block in the text response:

```python
import json

def format_artifact(artifact_dict: dict) -> str:
    type_name = artifact_dict["type"]
    json_str = json.dumps(artifact_dict, indent=2)
    return f"[[ARTIFACT_START:{type_name}]]\n{json_str}\n[[ARTIFACT_END]]"
```

Example:
```python
response = f"""Here's the subscription health report:

{format_artifact({
    "type": "data_table",
    "title": "At-Risk Subscriptions",
    "columns": [...],
    "rows": [...],
    "actions": [{"label": "Bulk Recovery", "intent": "bulk_recovery", "variant": "primary"}]
})}

We have 15 at-risk subscriptions totaling $5,234 MRR."""
```

## Gates Status

- [x] Gate 1: types.ts with 4+ artifact types + zod schemas
- [x] Gate 2: parser.ts handles `[[ARTIFACT_START:type]]...[[ARTIFACT_END]]` blocks
- [x] Gate 3: DataTableArtifact renders with sort, type-aware cells, collapsible
- [x] Gate 4: ActionButton has 3 variants + confirm dialog + click handler
- [x] Gate 5: ArtifactRouter wired into Thread renderer via ArtifactAwareText
- [x] Gate 6: `npx tsc --noEmit` passes (zero TS errors)
- [x] Gate 7: Vercel deploy succeeds + jarvis-os-iota.vercel.app loads

## Dependencies

All existing deps — no new packages added.
- `zod` for runtime validation
- `@assistant-ui/react-markdown` for MarkdownTextPrimitive + preprocess
- `remark-gfm` for markdown rendering
- `motion` for animations
- `lucide-react` for icons
- `@base-ui/react` Collapsible for expand/collapse

## Future (Stream 2B+)

- Chart library integration (recharts or lightweight canvas)
- Form artifacts (inputs, dropdowns, multi-step)
- Generative UI (AI dynamically builds UI from data shape)
- Artifact side panel persistence
- Export to CSV/PDF
