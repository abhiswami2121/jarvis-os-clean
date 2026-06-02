"use client";

interface SessionsCardProps {
  vpsSessions: number;
  mvpCount: number;
  goldenRunCount: number;
}

export default function SessionsCard({
  vpsSessions,
  mvpCount,
  goldenRunCount,
}: SessionsCardProps) {
  const items = [
    { label: "VPS Sessions", value: vpsSessions, color: "bg-blue-500" },
    { label: "MVPs Built", value: mvpCount, color: "bg-emerald-500" },
    {
      label: "Golden Runs",
      value: goldenRunCount,
      color: "bg-amber-500",
    },
  ];

  const maxVal = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="rounded-xl bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-5">
      <h2 className="text-sm font-medium text-zinc-400 mb-4">
        Infrastructure Overview
      </h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-zinc-300">{item.label}</span>
              <span className="text-sm font-medium text-zinc-100">
                {item.value}
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color} transition-all duration-500`}
                style={{
                  width: `${Math.max((item.value / maxVal) * 100, 2)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-zinc-600">
        Golden runs live at /home/hermes/data/golden_runs/
      </p>
    </div>
  );
}
