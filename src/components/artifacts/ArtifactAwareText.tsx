"use client";

import { memo, useMemo, useEffect, useState } from "react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import { defaultComponents } from "@/components/assistant-ui/markdown-text";
import { ArtifactList } from "@/components/artifacts/ArtifactRouter";
import { parseArtifacts } from "@/lib/artifacts/parser";
import type { Artifact } from "@/lib/artifacts/types";

let _pendingArtifacts: Artifact[] = [];

function preprocessFn(text: string): string {
  const parsed = parseArtifacts(text);
  _pendingArtifacts = parsed.artifacts;
  return parsed.cleanText;
}

/**
 * ArtifactAwareText — wraps text message part rendering with artifact detection.
 *
 * FIX (May 28, 2026): Previously used useAuiState(s => s.part.text) which doesn't exist
 * on AuiState — the scope check threw "current scope does not have a 'part' property".
 * Now accepts text as an explicit prop from JarvisText, which already gets text via {...part}.
 */
const ArtifactAwareTextImpl = ({ text }: { text?: string }) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const rawText = text || "";

  const hasBlocks = useMemo(() => {
    return rawText.includes("[[ARTIFACT_START:") && rawText.includes("[[ARTIFACT_END]]");
  }, [rawText]);

  useEffect(() => {
    if (hasBlocks && _pendingArtifacts.length > 0) {
      setArtifacts(_pendingArtifacts);
      _pendingArtifacts = [];
    } else if (!hasBlocks) {
      setArtifacts([]);
    }
  }, [hasBlocks, rawText]);

  if (hasBlocks) {
    return (
      <div>
        <MarkdownTextPrimitive
          remarkPlugins={[remarkGfm]}
          components={defaultComponents}
          preprocess={preprocessFn}
          className="aui-md"
        />
        {artifacts.length > 0 && <ArtifactList artifacts={artifacts} />}
      </div>
    );
  }

  return <MarkdownTextPrimitive remarkPlugins={[remarkGfm]} components={defaultComponents} className="aui-md" />;
};

export const ArtifactAwareText = memo(ArtifactAwareTextImpl);
export default ArtifactAwareText;
