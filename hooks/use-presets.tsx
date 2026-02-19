import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { WorkoutPreset } from "@/domain/models/WorkoutPreset";

type PresetsContextValue = {
  presets: WorkoutPreset[];
  addPreset: (preset: WorkoutPreset) => void;
  removePreset: (id: string) => void;
};

const PresetsContext = createContext<PresetsContextValue | null>(null);

export function PresetsProvider({ children }: { children: ReactNode }) {
  const [presets, setPresets] = useState<WorkoutPreset[]>([]);
  // TODO: Persist presets with AsyncStorage.

  const value = useMemo(
    () => ({
      presets,
      addPreset: (preset: WorkoutPreset) => setPresets((current) => [preset, ...current]),
      removePreset: (id: string) => setPresets((current) => current.filter((preset) => preset.id !== id)),
    }),
    [presets]
  );

  return <PresetsContext.Provider value={value}>{children}</PresetsContext.Provider>;
}

export function usePresets() {
  const context = useContext(PresetsContext);
  if (!context) throw new Error("usePresets must be used within PresetsProvider");
  return context;
}
