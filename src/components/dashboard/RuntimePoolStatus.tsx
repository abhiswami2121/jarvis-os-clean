"use client";
import { useEffect, useState } from "react";
import { Cpu } from "lucide-react";
import { RuntimeCard, type RuntimeData } from "./RuntimeCard";

export function RuntimePoolStatus() {
  const [runtimes, setRuntimes] = useState<RuntimeData[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await fetch("/api/runtimes", { cache: "no-store" });
        const data = await r.json();
        if (mounted) setRuntimes(data.runtimes || []);
      } catch {
        if (mounted) setRuntimes([]);
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Cpu className="size-4 text-zinc-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Runtime Pool</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {runtimes.map((r) => (<RuntimeCard key={r.id} runtime={r} />))}
      </div>
    </section>
  );
}
