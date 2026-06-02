import {
  ARTIFACT_START_PREFIX,
  ARTIFACT_END,
  validateArtifact,
  type Artifact,
  type ParseResult,
} from "./types";

/**
 * Parses artifact blocks from assistant text.
 *
 * Format: [[ARTIFACT_START:typename]]<JSON payload>[[ARTIFACT_END]]
 *
 * Double-bracket delimiters avoid collision with markdown link syntax [text](url).
 *
 * Handles:
 * - Multiple artifact blocks in one message
 * - Streaming partial blocks (incomplete blocks are left in cleanText)
 * - Invalid JSON (logged, block stripped from cleanText)
 * - Zod validation failures (logged, block stripped from cleanText)
 */
export function parseArtifacts(text: string): ParseResult {
  const errors: string[] = [];
  const artifacts: Artifact[] = [];
  let cleanText = text;

  // We need to find balanced [[ARTIFACT_START:type]]...[[ARTIFACT_END]] pairs
  let pos = 0;
  const consumedRanges: Array<[number, number]> = [];

  while (pos < cleanText.length) {
    const startIdx = cleanText.indexOf(ARTIFACT_START_PREFIX, pos);
    if (startIdx === -1) break;

    // Find the end of the start delimiter — extract type name
    const typeEndIdx = cleanText.indexOf("]]", startIdx + ARTIFACT_START_PREFIX.length);
    if (typeEndIdx === -1) {
      // Unterminated start tag — leave it in the text (streaming partial)
      break;
    }

    const typeName = cleanText.slice(
      startIdx + ARTIFACT_START_PREFIX.length,
      typeEndIdx
    ).trim();

    if (!typeName) {
      errors.push("Empty artifact type name — skipping block");
      pos = typeEndIdx + 2;
      continue;
    }

    // Now find the corresponding [[ARTIFACT_END]]
    const jsonStart = typeEndIdx + 2;
    const endIdx = cleanText.indexOf(ARTIFACT_END, jsonStart);

    if (endIdx === -1) {
      // No closing tag — block is incomplete (streaming). Leave it in text.
      break;
    }

    // Extract JSON payload
    const rawJson = cleanText.slice(jsonStart, endIdx).trim();
    const blockEnd = endIdx + ARTIFACT_END.length;

    if (!rawJson) {
      errors.push(`Empty JSON payload for artifact type "${typeName}"`);
      consumedRanges.push([startIdx, blockEnd]);
      pos = blockEnd;
      continue;
    }

    // Try to parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch (jsonErr: any) {
      errors.push(
        `Invalid JSON in artifact block "${typeName}": ${jsonErr?.message || String(jsonErr)}`
      );
      consumedRanges.push([startIdx, blockEnd]);
      pos = blockEnd;
      continue;
    }

    // Validate against artifact schema
    const { artifact, error: validationError } = validateArtifact(parsed);

    if (artifact) {
      artifacts.push(artifact);
    } else {
      errors.push(
        `Artifact validation failed for type "${typeName}": ${validationError || "unknown error"}`
      );
    }

    // Mark this range for removal from cleanText
    consumedRanges.push([startIdx, blockEnd]);
    pos = blockEnd;
  }

  // Build cleanText by removing consumed blocks (in reverse order to preserve indices)
  if (consumedRanges.length > 0) {
    const parts: string[] = [];
    let lastEnd = 0;

    // Sort by start position
    consumedRanges.sort((a, b) => a[0] - b[0]);

    // Merge overlapping ranges (shouldn't happen, but defensive)
    const merged: Array<[number, number]> = [];
    for (const [s, e] of consumedRanges) {
      if (merged.length > 0 && s <= merged[merged.length - 1][1]) {
        merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
      } else {
        merged.push([s, e]);
      }
    }

    for (const [s, e] of merged) {
      parts.push(cleanText.slice(lastEnd, s));
      lastEnd = e;
    }
    parts.push(cleanText.slice(lastEnd));
    cleanText = parts.join("").trim();
  }

  return { cleanText, artifacts, errors };
}

/**
 * Quick check: does the text contain any artifact blocks?
 * Use this for fast-path decisions before invoking the full parser.
 */
export function hasArtifactBlocks(text: string): boolean {
  return text.includes(ARTIFACT_START_PREFIX) && text.includes(ARTIFACT_END);
}

/**
 * Preprocess function for MarkdownTextPrimitive's `preprocess` prop.
 * Strips artifact blocks from text before markdown rendering.
 * Use only when you need clean markdown but don't need the parsed artifacts.
 */
export function preprocessStripArtifacts(text: string): string {
  const { cleanText } = parseArtifacts(text);
  return cleanText;
}

// ── Canvas XML Tag Support ────────────────────────────────────────────
//
// The <canvas id="..." title="..." type="..." version="...">...</canvas>
// XML tag is an alternative format for artifact blocks. When detected during
// LLM streaming, the content is extracted, pushed to the artifactStore, and
// the canvas is auto-opened.

export interface CanvasTagResult {
  hasCanvas: boolean;
  textFeed: string; // cleaned text without canvas tags
  canvasData: {
    id: string;
    title: string;
    type: string;
    version: number;
    content: string;
  } | null;
}

// Regex for <canvas> XML tags. Handles incomplete/closing tags in streaming.
const CANVAS_TAG_REGEX = /<canvas\s+id="([^"]+)"\s+title="([^"]+)"\s+type="([^"]+)"(?:\s+version="(\d+)")?\s*>([\s\S]*?)(?:<\/canvas>|$)/;

export function parseCanvasTag(text: string): CanvasTagResult {
  // Reset lastIndex (regex is global)
  CANVAS_TAG_REGEX.lastIndex = 0;
  const match = CANVAS_TAG_REGEX.exec(text);
  if (!match) {
    return { hasCanvas: false, textFeed: text, canvasData: null };
  }

  const [, id, title, type, versionStr, rawContent] = match;

  // Clean code fences inside canvas content
  let content = rawContent.trim();
  content = content.replace(/^```[a-zA-Z0-9]*\n?/, "").replace(/\n?```$/, "");

  // Replace canvas block with a clean notification in chat text
  const textFeed = text.replace(match[0], "").trim();

  return {
    hasCanvas: true,
    textFeed,
    canvasData: {
      id,
      title,
      type,
      version: parseInt(versionStr || "1", 10),
      content,
    },
  };
}

/**
 * Streaming variant: detects partial canvas tags (not yet closed).
 * Use to avoid premature parsing during active streaming.
 */
export function detectPartialCanvasTag(text: string): boolean {
  return /<canvas\s+id=/.test(text) && !/<\/canvas>/.test(text);
}
