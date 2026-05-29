"use client";

import React, { useState, useCallback, useEffect, use } from "react";
import { FileText, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { DocumentsMenu } from "@/components/jarvis/DocumentsMenu";
import { MarkdownViewer } from "@/components/jarvis/MarkdownViewer";
import { getDocument, type DocumentMeta } from "@/lib/documents-source";

export default function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = use(searchParams);
  const initialId = params.id || null;

  const [selectedDoc, setSelectedDoc] = useState<DocumentMeta | null>(null);
  const [docContent, setDocContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDoc = useCallback(async (doc: DocumentMeta) => {
    setSelectedDoc(doc);
    setLoading(true);
    setError(null);
    try {
      const result = await getDocument(doc.id);
      if (result) {
        setDocContent(result.content);
      } else {
        setError("Document not found");
        setDocContent("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load document");
      setDocContent("");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial doc from URL param
  useEffect(() => {
    if (initialId) {
      // We need a minimal meta to trigger load
      loadDoc({
        id: initialId,
        title: "Loading...",
        path: initialId,
        size: 0,
        updatedAt: new Date().toISOString(),
        type: "output",
        source: "base44",
      });
    }
  }, [initialId, loadDoc]);

  const handleSelect = useCallback(
    (doc: DocumentMeta) => {
      // Update URL without navigation
      const url = new URL(window.location.href);
      url.searchParams.set("id", doc.id);
      window.history.replaceState({}, "", url.toString());
      loadDoc(doc);
    },
    [loadDoc]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#08080f]">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-white/[0.05] bg-white/[0.02] backdrop-blur-xl">
        <DocumentsMenu onSelect={handleSelect} selectedId={selectedDoc?.id} />
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {selectedDoc ? (
          <>
            {error && (
              <div className="mx-6 mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <MarkdownViewer
              document={selectedDoc}
              content={docContent}
              loading={loading}
              className="flex-1"
            />
          </>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center flex-1 text-center px-6"
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
        <FileText className="size-8 text-emerald-400" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-200 mb-2">
        Documents
      </h2>
      <p className="text-sm text-zinc-500 max-w-sm">
        Select a document from the sidebar to view it here.
        PRDs, plans, specs, audits, and agent outputs are all available.
      </p>
    </motion.div>
  );
}
