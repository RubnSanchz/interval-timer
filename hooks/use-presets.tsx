import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { WorkoutPreset } from "@/domain/models/WorkoutPreset";
import { validateTimerConfig } from "@/domain/validators/validateTimerConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

type PresetsContextValue = {
  presets: WorkoutPreset[];
  addPreset: (preset: WorkoutPreset) => void;
  removePreset: (id: string) => void;
};

const PresetsContext = createContext<PresetsContextValue | null>(null);

const STORAGE_KEY = "intervalTimer.presets.v1";

function parsePreset(raw: unknown): WorkoutPreset | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<WorkoutPreset>;

  if (typeof candidate.id !== "string" || typeof candidate.name !== "string") return null;
  if (typeof candidate.createdAt !== "string" || typeof candidate.updatedAt !== "string") return null;
  if (typeof candidate.exerciseAutoAdvance !== "boolean" || typeof candidate.restAutoAdvance !== "boolean") return null;

  const sets = Number(candidate.sets);
  const exerciseSeconds = Number(candidate.exerciseSeconds);
  const restSeconds = Number(candidate.restSeconds);

  try {
    const config = validateTimerConfig({
      sets,
      exerciseSeconds,
      restSeconds,
      exerciseAutoAdvance: candidate.exerciseAutoAdvance,
      restAutoAdvance: candidate.restAutoAdvance,
    });
    return {
      id: candidate.id,
      name: candidate.name,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
      ...config,
    };
  } catch {
    return null;
  }
}

export function PresetsProvider({ children }: { children: ReactNode }) {
  const [presets, setPresets] = useState<WorkoutPreset[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;
    async function loadPresets() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return;
        const hydrated = parsed.map(parsePreset).filter((preset): preset is WorkoutPreset => Boolean(preset));
        if (isActive) setPresets(hydrated);
      } catch {
      } finally {
        if (isActive) setIsHydrated(true);
      }
    }
    loadPresets();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(presets)).catch(() => {});
  }, [isHydrated, presets]);

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
