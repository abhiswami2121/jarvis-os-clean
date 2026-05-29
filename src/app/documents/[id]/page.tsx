"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { MarkdownViewer } from "@/components/jarvis/MarkdownViewer";
import { getDocument, type DocumentMeta } from "@/lib/documents-source";

export default function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const decodedId = decodeURIComponent(id);

  const [doc, setDoc] = useState<DocumentMeta | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getDocument(decodedId);
        if (result) {
          setDoc(result.meta);
          setContent(result.content);
        } else {
          setError("Document not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load document");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [decodedId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#08080f]">
        <Loader2 className="size-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#08080f] gap-4">
        <FileText className="size-12 text-zinc-600" />
        <p className="text-sm text-zinc-400">{error || "Document not found"}</p>
        <button
          onClick={() => router.push("/documents")}
          className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-2 text-sm text-zinc-300 hover:bg-white/[0.08] transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Documents
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#08080f]">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-white/[0.04] bg-[#08080f]/95 backdrop-blur-sm">
        <button
          onClick={() => router.push("/documents")}
          className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          All documents
        </button>
        <span className="text-xs text-zinc-600">/</span>
        <span className="text-xs text-zinc-300 font-medium truncate">
          {doc.title}
        </span>
      </div>

      <div className="flex-1 overflow-hidden" style={{ height: "calc(100vh - 49px)" }}>
        <MarkdownViewer document={doc} content={content} />
      </div>
    </div>
  );
}
