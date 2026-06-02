"use client";

import {
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
} from "@assistant-ui/react";

/**
 * Jarvis OS attachment adapter — handles file uploads in the composer.
 *
 * - Image attachments (PNG, JPG, GIF, WebP): base64-encoded as data: URIs
 *   for DeepSeek V4 Pro vision processing.
 * - Text attachments (.txt, .md, .csv): auto-processed by SimpleTextAttachmentAdapter.
 *
 * Attached via useLocalRuntime adapters option in jarvis-runtime.tsx.
 */
export const newleafAttachmentAdapter = new CompositeAttachmentAdapter([
  new SimpleImageAttachmentAdapter(),
  new SimpleTextAttachmentAdapter(),
]);

export default newleafAttachmentAdapter;
