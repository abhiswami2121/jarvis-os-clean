"use client";

import { DataTableArtifact } from "@/components/artifacts/DataTableArtifact";
import { ChartArtifact } from "@/components/artifacts/ChartArtifact";
import { StatusCardArtifact } from "@/components/artifacts/StatusCardArtifact";
import { ActionPanelArtifact } from "@/components/artifacts/ActionPanelArtifact";
import { DeployedAppCard } from "@/components/artifacts/DeployedAppCard";
import type { Artifact } from "@/lib/artifacts/types";
import { LiquidErrorCard } from "./LiquidErrorCard";
import { SlackCanvasArtifact } from "./SlackCanvasArtifact";
import { ErrorRecoveryArtifactComponent } from "./ErrorRecoveryArtifact";
import { ExpandButton } from "./ExpandButton";

// ── Props ───────────────────────────────────────────────────────
interface ArtifactRouterProps {
  artifact: Artifact;
  className?: string;
}

/**
 * Routes an Artifact to the correct component based on its type.
 * Each artifact gets an "Expand" button that opens it in the
 * full ArtifactWorkspace drawer for a richer interactive experience.
 */
export function ArtifactRouter({ artifact, className }: ArtifactRouterProps) {
  const renderArtifact = () => {
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
      case "deployed_app":
        return <DeployedAppCard artifact={artifact as any} className={className} />;
      default:
        return <LiquidErrorCard title="Unknown Artifact Type" message={`Cannot render artifact type: ${(artifact as any).type}`} />;
    }
  };

  return (
    <div className="group/artifact relative">
      {renderArtifact()}
      {/* Expand button — appears on hover, opens in ArtifactWorkspace drawer */}
      <ExpandButton artifact={artifact} />
    </div>
  );
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
