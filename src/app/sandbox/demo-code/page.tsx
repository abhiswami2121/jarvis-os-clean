import CanvasShell from "@/components/canvas/CanvasShell";
import ArtifactRenderer, { type ArtifactData } from "@/components/canvas/ArtifactRenderer";

const DEMO_FILES: ArtifactData["files"] = [
  {
    path: "package.json",
    language: "json",
    content: `{
  "name": "aurora-dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "lucide-react": "^1.17.0",
    "recharts": "^2.15.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "typescript": "^5.7.0",
    "vite": "^6.2.0"
  }
}`,
  },
  {
    path: "src/App.tsx",
    language: "tsx",
    content: `import { useState, useEffect } from "react";
import { Activity, Users, CreditCard, TrendingUp } from "lucide-react";
import { MetricCard } from "./components/MetricCard";
import { RevenueChart } from "./components/RevenueChart";
import { ActivityFeed } from "./components/ActivityFeed";
import type { DashboardData } from "./types";

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Aurora Dashboard</h1>
        <p className="text-sm text-zinc-500">Real-time operations overview</p>
      </header>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={Activity}
          label="Active Now"
          value={data?.activeUsers ?? 0}
          trend="+12%"
          trendUp
        />
        <MetricCard
          icon={Users}
          label="Total Customers"
          value={data?.totalCustomers ?? 0}
          trend="+3.2%"
          trendUp
        />
        <MetricCard
          icon={CreditCard}
          label="MRR"
          value={\`$\${(data?.mrr ?? 0).toLocaleString()}\`}
          trend="+8.1%"
          trendUp
        />
        <MetricCard
          icon={TrendingUp}
          label="Recovery Rate"
          value={\`\${data?.recoveryRate ?? 0}%\`}
          trend="+1.5%"
          trendUp
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <RevenueChart data={data?.revenue ?? []} />
        <ActivityFeed items={data?.activity ?? []} />
      </div>
    </div>
  );
}`,
  },
  {
    path: "src/components/Button.tsx",
    language: "tsx",
    content: `import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary:
    "bg-emerald-400 text-zinc-950 hover:bg-emerald-300 ring-1 ring-emerald-400/20",
  secondary:
    "bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] ring-1 ring-white/[0.06]",
  ghost:
    "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200",
  danger:
    "bg-red-400/10 text-red-400 hover:bg-red-400/20 ring-1 ring-red-400/20",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <svg
            className="size-3.5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-20"
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";`,
  },
  {
    path: "README.md",
    language: "markdown",
    content: `# Aurora Dashboard

> Real-time operations dashboard for NewLeaf Financial

## Quick Start

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite 6
- **Styling**: Tailwind CSS v4 + NewLeaf Glass Design System
- **Charts**: Recharts
- **Icons**: Lucide React

## Design Tokens

| Token | Value |
| ----- | ----- |
| bg-base | \`#09090b\` (zinc-950) |
| bg-glass | \`rgba(255,255,255,0.02)\` |
| border-glass | \`rgba(255,255,255,0.04)\` |
| accent-success | \`#34d399\` (emerald-400) |
| accent-warning | \`#fbbf24\` (amber-400) |
| accent-danger | \`#f87171\` (red-400) |

## Architecture

\`\`\`
src/
├── App.tsx              # Root dashboard
├── components/
│   ├── MetricCard.tsx   # KPI display card
│   ├── Button.tsx       # Design system button
│   ├── RevenueChart.tsx # Revenue over time
│   └── ActivityFeed.tsx # Real-time activity
├── lib/
│   └── utils.ts         # cn() helper
└── types.ts             # Shared types
\`\`\`

## Deployment

Deployed via Vercel with automatic previews on PR.
`,
  },
  {
    path: "vite.config.ts",
    language: "typescript",
    content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          charts: ["recharts"],
        },
      },
    },
  },
});`,
  },
];

const DEMO_ARTIFACT: ArtifactData = {
  type: "code",
  files: DEMO_FILES,
};

export default function DemoCodePage() {
  return (
    <CanvasShell slug="demo-code" title="Aurora Dashboard — Source" status="complete">
      <ArtifactRenderer artifact={DEMO_ARTIFACT} />
    </CanvasShell>
  );
}
