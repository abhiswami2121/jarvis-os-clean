"use client";

import { memo, useMemo, useEffect, useRef } from "react";
import { HistoryMarkdown } from "@/components/jarvis/HistoryMarkdown";
import { ArtifactList } from "@/components/artifacts/ArtifactRouter";
import { parseArtifacts, parseCanvasTag } from "@/lib/artifacts/parser";
import { useArtifactStore } from "@/stores/artifactStore";
import { useCanvasStore, type TemplateType } from "@/lib/stores/canvas-store";

/**
 * Map canvas XML tag type → canvas store template type.
 * The <canvas type="..."> attribute maps to the template renderer.
 */
function mapCanvasTypeToTemplate(canvasType: string): TemplateType {
  const t = canvasType.toLowerCase();
  if (t === "report") return "mission-report";
  if (t === "data" || t === "data_table") return "data-explorer";
  if (t === "chart") return "data-explorer";
  if (t === "mini-app") return "generic";
  if (t === "code") return "generic";
  return "generic";
}

/**
 * ArtifactAwareText — renders a text message part with artifact detection.
 *
 * CRITICAL FIX (June 2, 2026): Previously rendered artifacts ONLY inline in chat
 * via <ArtifactList>. Now it ALSO pushes every parsed artifact to useArtifactStore,
 * which auto-opens the side panel (split mode). Inline rendering is preserved as a
 * compact preview, but the full artifact experience is in the side panel.
 *
 * FIX (May 29, 2026): Previously rendered <MarkdownTextPrimitive>, which reads
 * text from the assistant-ui part scope via internal hooks and threw scope errors
 * whenever rendered outside a live message-part scope (history replay / refresh).
 *
 * Now it takes `text` as an explicit prop (JarvisText passes it via {...part})
 * and renders through HistoryMarkdown — a self-contained react-markdown renderer
 * with ZERO assistant-ui hooks. Works identically live OR replayed from history.
 */
const ArtifactAwareTextImpl = ({ text }: { text?: string }) => {
  const rawText = text || "";
  const pushToStore = useArtifactStore((s) => s.push);
  const history = useArtifactStore((s) => s.history);
  const canvasOpen = useCanvasStore((s) => s.open);
  // Track which artifact IDs we've already pushed to avoid duplicates on re-render
  const pushedIds = useRef<Set<string>>(new Set());

  const { cleanText, artifacts } = useMemo(() => {
    // Check for [[ARTIFACT_START:type]]...[[ARTIFACT_END]] blocks
    const hasBlocks =
      rawText.includes("[[ARTIFACT_START:") && rawText.includes("[[ARTIFACT_END]]");

    // Also check for <canvas id="..." ...> XML tags
    const hasCanvasTag = rawText.includes("<canvas id=") && rawText.includes("</canvas>");

    if (!hasBlocks && !hasCanvasTag) return { cleanText: rawText, artifacts: [] as any[] };

    // Parse [[ARTIFACT_START]] blocks (primary format)
    const parsed = hasBlocks
      ? parseArtifacts(rawText)
      : { cleanText: rawText, artifacts: [] as any[], errors: [] as string[] };

    // Also parse <canvas> XML tags (alternative format)
    if (hasCanvasTag) {
      const canvasResult = parseCanvasTag(rawText);
      if (canvasResult.hasCanvas && canvasResult.canvasData) {
        const cd = canvasResult.canvasData;
        // Convert canvas tag to artifact format (for ArtifactPanel + ArtifactRouter)
        // Mark with _fromCanvasTag so the bridge effect routes it to CanvasOverlay too
        parsed.artifacts.push({
          type: cd.type as any,
          title: cd.title,
          content: cd.content,
          _fromCanvasTag: true,
          _canvasId: cd.id,
          _canvasVersion: cd.version,
        } as any);
        // Use the canvas-cleaned text if it removed more
        if (canvasResult.textFeed.length < parsed.cleanText.length) {
          parsed.cleanText = canvasResult.textFeed;
        }
      }
    }

    return parsed;
  }, [rawText]);

  // Push artifacts to side panel store (auto-opens panel via push())
  useEffect(() => {
    if (artifacts.length === 0) return;

    for (const artifact of artifacts) {
      // Generate a stable dedup key from title + type + content head
      const contentHead =
        typeof (artifact as any).content === "string"
          ? (artifact as any).content.slice(0, 100)
          : "";
      const dedupKey = `${artifact.type}:${(artifact as any).title || ""}:${contentHead}`;
      if (pushedIds.current.has(dedupKey)) continue;

      // Check if already in history (prevent duplicates across re-renders)
      const existsInHistory = history.some(
        (h) => h.title === (artifact as any).title && h.type === artifact.type
      );
      if (existsInHistory) {
        pushedIds.current.add(dedupKey);
        continue;
      }

      pushedIds.current.add(dedupKey);

      // Map artifact type to store-compatible type WITH FULL FIDELITY
      const storeType =
        artifact.type === "data_table" ? "data"
        : artifact.type === "chart" ? "chart"
        : artifact.type === "status_card" ? "data"
        : artifact.type === "action_panel" ? "report"
        : "report";

      pushToStore({
        type: storeType,
        title: (artifact as any).title || "Artifact",
        content:
          (artifact as any).content ||
          JSON.stringify(artifact, null, 2),
        ...(artifact.type === "data_table" && {
          columns: (artifact as any).columns,
          rows: (artifact as any).rows,
          totalRows: (artifact as any).metadata?.totalRows,
        }),
      });

      // BRIDGE: Also push canvas XML tags to the CanvasOverlay via useCanvasStore.
      // This is what was missing — the CanvasOverlay was orphaned because nothing
      // ever called useCanvasStore.open(). Now <canvas> tags trigger the full-
      // screen template-based canvas overlay with rich rendering.
      if ((artifact as any)._fromCanvasTag) {
        const artType = (artifact as any).type || "report";
        canvasOpen({
          template: mapCanvasTypeToTemplate(artType),
          data: {
            title: (artifact as any).title,
            content: (artifact as any).content,
            ...(artifact as any),
          },
          title: (artifact as any).title,
        });
      }
    }
  }, [artifacts, pushToStore, history, canvasOpen]);

  if (!rawText) return null;

  // Clean text (without artifact blocks) gets rendered as markdown.
  // Inline artifact previews are kept for quick scanning in chat,
  // but the full artifact experience is in the side panel.
  return (
    <div>
      <HistoryMarkdown content={cleanText} />
      {artifacts.length > 0 && (
        <>
          <div className="mt-3 mb-2 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#6E8BFF]/20 to-transparent" />
            <span className="text-[10px] font-semibold text-[#6E8BFF]/60 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <span className="inline-block size-1.5 rounded-full bg-[#6E8BFF]/50" />
              Canvas
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#6E8BFF]/20 to-transparent" />
          </div>
          <ArtifactList artifacts={artifacts} />
        </>
      )}
    </div>
  );
};

export const ArtifactAwareText = memo(ArtifactAwareTextImpl);
export default ArtifactAwareText;
