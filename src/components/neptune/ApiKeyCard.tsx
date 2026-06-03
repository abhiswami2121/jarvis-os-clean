"use client";
import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  envKey: string;
  icon: string;
  description: string;
  preview?: string;
  active: boolean;
  primary?: boolean;
  fallbackNote?: string;
}

export function ApiKeyCard({ name, envKey, icon, description, preview, active, primary, fallbackNote }: Props) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/user/settings/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key_name: envKey }),
      });
      if (res.ok) {
        setTestResult("ok");
        toast.success(`${name} key is valid`);
      } else {
        setTestResult("fail");
        toast.error(`${name} key test failed`);
      }
    } catch {
      setTestResult("fail");
      toast.error(`Failed to test ${name} key`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all",
      primary
        ? "border-emerald-500/20 bg-emerald-500/[0.03]"
        : "border-white/[0.06] bg-white/[0.02]"
    )}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-white">{name}</span>
            {primary && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                PRIMARY
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">{description}</div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status */}
          {active ? (
            <CheckCircle className="size-4 text-emerald-400" />
          ) : (
            <XCircle className="size-4 text-zinc-600" />
          )}

          {/* Key preview */}
          {preview && (
            <code className="text-[10px] text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded">
              {preview}
            </code>
          )}

          {/* Test button */}
          <button
            type="button"
            onClick={testConnection}
            disabled={testing || !active}
            className={cn(
              "text-[10px] font-medium px-2 py-1 rounded-lg transition-all",
              active
                ? "bg-white/[0.05] text-zinc-400 hover:bg-white/[0.10] hover:text-zinc-200 disabled:opacity-40"
                : "bg-white/[0.02] text-zinc-700 cursor-not-allowed"
            )}
          >
            {testing ? (
              <Loader2 className="size-3 animate-spin" />
            ) : testResult === "ok" ? (
              <span className="text-emerald-400">✓ Valid</span>
            ) : testResult === "fail" ? (
              <span className="text-red-400">✗ Fail</span>
            ) : (
              "Test"
            )}
          </button>
        </div>
      </div>

      {fallbackNote && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400/80">
          <AlertTriangle className="size-3" />
          {fallbackNote}
        </div>
      )}
    </div>
  );
}
