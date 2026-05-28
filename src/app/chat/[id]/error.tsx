"use client";
import { useEffect } from "react";

export default function ChatError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error("[chat] Crashed:", error);
  }, [error]);

  return (
    <div style={{ background: "#08080f", color: "#fafafa", minHeight: "100vh", padding: "40px", fontFamily: "monospace" }}>
      <h1 style={{ fontSize: "24px", color: "#f87171", marginBottom: "20px" }}>
        Chat page crashed
      </h1>
      <pre style={{ background: "#1a1a24", padding: "20px", borderRadius: "8px", overflow: "auto", color: "#fbbf24" }}>
        {`Message: ${error.message || "unknown"}\nDigest: ${error.digest || "none"}\nStack: ${error.stack || "none"}`}
      </pre>
      <button
        onClick={reset}
        style={{ marginTop: "20px", padding: "12px 24px", background: "#10b981", color: "#000", borderRadius: "6px", border: "none", cursor: "pointer" }}
      >
        Try again
      </button>
    </div>
  );
}
