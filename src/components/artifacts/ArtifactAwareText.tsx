"use client";

import { memo, useMemo } from "react";
import { HistoryMarkdown } from "@/components/jarvis/HistoryMarkdown";
import { ArtifactList } from "@/components/artifacts/ArtifactRouter";
import { parseArtifacts } from "@/lib/artifacts/parser";

/**
 * ArtifactAwareText — renders a text message part with artifact detection.
 *
 * FIX (May 29, 2026): Previously rendered <MarkdownTextPrimitive>, which reads
 * text from the assistant-ui part scope via internal hooks (useState / useAuiState)
 * and threw `The current scope does not have a "part" property` whenever it was
 * rendered outside a live message-part scope (history replay / refresh).
 *
 * Now it takes `text` as an explicit prop (JarvisText passes it via {...part})
 * and renders through HistoryMarkdown — a self-contained react-markdown renderer
 * with ZERO assistant-ui hooks. Works identically live OR replayed from history.
 */
const ArtifactAwareTextImpl = ({ text }: { text?: string }) => {
  const rawText = text || "";

  const { cleanText, artifacts } = useMemo(() => {
    const hasBlocks =
      rawText.includes("[[ARTIFACT_START:") && rawText.includes("[[ARTIFACT_END]]");
    if (!hasBlocks) return { cleanText: rawText, artifacts: [] };
    const parsed = parseArtifacts(rawText);
    return { cleanText: parsed.cleanText, artifacts: parsed.artifacts };
  }, [rawText]);

  if (!rawText) return null;

  return (
    <div>
      <HistoryMarkdown content={cleanText} />
      {artifacts.length > 0 && <ArtifactList artifacts={artifacts} />}
    </div>
  );
};

export const ArtifactAwareText = memo(ArtifactAwareTextImpl);
export default ArtifactAwareText;
