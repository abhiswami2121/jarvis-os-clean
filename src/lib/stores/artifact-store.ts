import { create } from "zustand";

export type ArtifactPayload = {
  title?: string;
  channel?: string;
  permalink?: string;
  canvas_id?: string;
  markdown?: string;
  ts?: string;
  reportData?: Record<string, any>;
};

type ArtifactStore = {
  isOpen: boolean;
  payload: ArtifactPayload | null;
  activeTab: "financial" | "integration" | "manifest";
  setOpen: (open: boolean) => void;
  setPayload: (payload: ArtifactPayload | null) => void;
  setActiveTab: (tab: "financial" | "integration" | "manifest") => void;
  close: () => void;
  open: (payload: ArtifactPayload) => void;
};

export const useArtifactStore = create<ArtifactStore>((set) => ({
  isOpen: false,
  payload: null,
  activeTab: "financial",
  setOpen: (open) => set({ isOpen: open }),
  setPayload: (payload) => set({ payload }),
  setActiveTab: (activeTab) => set({ activeTab }),
  close: () => set({ isOpen: false }),
  open: (payload) => set({ isOpen: true, payload }),
}));
