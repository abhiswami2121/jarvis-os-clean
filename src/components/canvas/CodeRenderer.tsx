"use client";

import { useState, useMemo } from "react";
import { File, Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";

interface CodeFile {
  path: string;
  content: string;
  language?: string;
}

interface CodeRendererProps {
  files: CodeFile[];
  /** Optional previous files for diff highlighting */
  prevFiles?: CodeFile[];
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
  file?: CodeFile;
}

function buildTree(files: CodeFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      let node = current.find((n) => n.name === part);
      if (!node) {
        node = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          isDirectory: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        current.push(node);
      }
      if (!isLast) {
        current = node.children;
      }
    }
  }

  // Sort: directories first, then files, both alphabetically
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children.length) sortNodes(node.children);
    }
  };
  sortNodes(root);
  return root;
}

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    tsx: "typescript",
    ts: "typescript",
    jsx: "javascript",
    js: "javascript",
    json: "json",
    css: "css",
    html: "html",
    md: "markdown",
    py: "python",
    rs: "rust",
    go: "go",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    svg: "xml",
    sql: "sql",
    sh: "bash",
    bash: "bash",
    env: "plaintext",
    gitignore: "plaintext",
    dockerfile: "dockerfile",
  };
  return map[ext] || "plaintext";
}

// Simple syntax highlighting via CSS classes
// highlight.js handles this when classes are present
function highlightCode(code: string, language: string): string {
  // Escape HTML entities
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function FileTreeNode({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (node.isDirectory) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 transition-colors"
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          {expanded ? (
            <ChevronDown className="size-3 shrink-0 text-zinc-600" />
          ) : (
            <ChevronRight className="size-3 shrink-0 text-zinc-600" />
          )}
          {expanded ? (
            <FolderOpen className="size-3.5 shrink-0 text-amber-400/60" />
          ) : (
            <Folder className="size-3.5 shrink-0 text-amber-400/60" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedPath === node.path;

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs transition-colors ${
        isSelected
          ? "bg-white/[0.06] text-zinc-100"
          : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
      }`}
      style={{ paddingLeft: `${depth * 12 + 4}px` }}
    >
      <File className="size-3.5 shrink-0 text-zinc-500" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

/** Compute a simple line-level diff between two strings */
function computeDiff(
  current: string,
  previous: string | undefined,
): { additions: Set<number>; deletions: Set<number> } | null {
  if (!previous || !current) return null;
  const currLines = current.split("\n");
  const prevLines = previous.split("\n");

  const prevSet = new Set(prevLines);
  const currSet = new Set(currLines);

  const additions = new Set<number>();
  const deletions = new Set<number>();

  currLines.forEach((line, i) => {
    if (!prevSet.has(line) && line.trim()) additions.add(i);
  });
  // For deletions, we'd need prev content lines — but since we're viewing current file,
  // we highlight lines that were NOT in the previous version
  // prevLines.forEach((line, i) => {
  //   if (!currSet.has(line) && line.trim()) deletions.add(i);
  // });

  return additions.size > 0 ? { additions, deletions } : null;
}

export default function CodeRenderer({ files, prevFiles }: CodeRendererProps) {
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || "");
  const tree = useMemo(() => buildTree(files), [files]);

  const selectedFile = files.find((f) => f.path === selectedPath);
  const prevFile = prevFiles?.find((f) => f.path === selectedPath);
  const language = selectedFile
    ? selectedFile.language || getLanguage(selectedFile.path)
    : "plaintext";

  // Compute diff if prevFiles provided
  const diff = useMemo(
    () => (selectedFile ? computeDiff(selectedFile.content, prevFile?.content) : null),
    [selectedFile, prevFile],
  );

  /** Render code with diff highlighting */
  function renderCodeWithDiff(content: string): string {
    const escaped = highlightCode(content, language);
    if (!diff) return escaped;

    const lines = escaped.split("\n");
    return lines
      .map((line, i) => {
        let cls = "";
        if (diff.additions.has(i)) {
          cls = 'class="diff-add bg-emerald-400/[0.06] border-l-2 border-emerald-400/30 pl-2"';
        } else if (diff.deletions.has(i)) {
          cls = 'class="diff-del bg-red-400/[0.06] border-l-2 border-red-400/30 pl-2"';
        }
        return cls ? `<span ${cls}>${line}</span>` : line;
      })
      .join("\n");
  }

  return (
    <div className="flex h-full min-h-[400px]">
      {/* File Tree */}
      <aside className="w-56 shrink-0 overflow-y-auto border-r border-white/[0.04] bg-zinc-950/50 py-2">
        <div className="px-3 pb-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            Files
          </span>
        </div>
        {tree.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            depth={0}
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
          />
        ))}
      </aside>

      {/* Code Content */}
      <div className="flex-1 overflow-auto">
        {/* File header */}
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-white/[0.04] bg-zinc-950/90 px-4 py-2 backdrop-blur-sm">
          <File className="size-3.5 text-zinc-500" />
          <span className="text-xs font-mono text-zinc-400">{selectedPath}</span>
          {diff && (
            <span className="text-[10px] text-emerald-400/70 ml-2">
              +{diff.additions.size} changes
            </span>
          )}
          <span className="ml-auto rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 uppercase">
            {language}
          </span>
        </div>

        {/* Code */}
        <div className="p-4">
          <pre className="overflow-x-auto text-sm font-mono leading-relaxed">
            <code
              className={`hljs language-${language} text-zinc-300`}
              dangerouslySetInnerHTML={{
                __html: renderCodeWithDiff(selectedFile?.content || "// No file selected"),
              }}
            />
          </pre>
          {/* Diff legend */}
          {diff && (
            <div className="mt-4 flex items-center gap-4 text-[10px] text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-400/30 rounded" />
                Addition
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-red-400/30 rounded" />
                Removal
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
