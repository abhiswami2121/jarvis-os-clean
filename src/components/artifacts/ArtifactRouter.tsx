"use client";

import { DataTableArtifact } from "@/components/artifacts/DataTableArtifact";
import { ChartArtifact } from "@/components/artifacts/ChartArtifact";
import { StatusCardArtifact } from "@/components/artifacts/StatusCardArtifact";
import { ActionPanelArtifact } from "@/components/artifacts/ActionPanelArtifact";
import type { Artifact } from "@/lib/artifacts/types";
import { LiquidErrorCard } from "./LiquidErrorCard";
import { SlackCanvasArtifact } from "./SlackCanvasArtifact";
import { ErrorRecoveryArtifactComponent } from "./ErrorRecoveryArtifact";

// ── Props ───────────────────────────────────────────────────────
interface ArtifactRouterProps {
  artifact: Artifact;
  className?: string;
}

/**
 * Routes an Artifact to the correct component based on its type.
 */
export function ArtifactRouter({ artifact, className }: ArtifactRouterProps) {
  switch (artifact.type) {
    case "data_table":
      return <DataTableArtifact artifact={artifact} className={className} />;
    case "chart":
      return <ChartArtifact artifact={artifact} className={className} />;
    case "status_card":
      return <StatusCardArtifact artifact={artifact} className={className} />;
    case "slack_canvas":
      return <SlackCanvasArtifact artifact={artifact as any} />;
      case "error_recovery":
        return <ErrorRecoveryArtifactComponent artifact={artifact as any} />;
    case "action_panel":
      return <ActionPanelArtifact artifact={artifact} className={className} />;
    default:
      return <LiquidErrorCard title="Unknown Artifact Type" message={`Cannot render artifact type: ${(artifact as any).type}`} />;
    // legacy default:
      // Exhaustiveness check — should never happen with validated artifacts
      return null;
  }
}

// ── Multi-artifact renderer ─────────────────────────────────────
interface ArtifactListProps {
  artifacts: Artifact[];
  className?: string;
}

export function ArtifactList({ artifacts, className }: ArtifactListProps) {
  if (!artifacts.length) return null;

  return (
    <div className={className}>
      {artifacts.map((artifact, i) => (
        <ArtifactRouter key={`${artifact.type}-${i}`} artifact={artifact} />
      ))}
    </div>
  );
}

export default ArtifactRouter;
