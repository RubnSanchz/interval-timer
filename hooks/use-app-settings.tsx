import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type AppSettings = {
  hapticsEnabled: boolean;
  keepAwakeEnabled: boolean;
  soundVolume: number;
};

type AppSettingsContextValue = AppSettings & {
  setHapticsEnabled: (enabled: boolean) => void;
  setKeepAwakeEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
};

const STORAGE_KEY = "intervalTimer.settings.v1";
const DEFAULT_SETTINGS: AppSettings = { hapticsEnabled: true, keepAwakeEnabled: true, soundVolume: 0.6 };

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

function clampSoundVolume(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_SETTINGS.soundVolume;
  return Math.min(1, Math.max(0, value));
}

function parseSettings(raw: unknown): AppSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<AppSettings>;
  const hapticsEnabled =
    typeof candidate.hapticsEnabled === "boolean" ? candidate.hapticsEnabled : DEFAULT_SETTINGS.hapticsEnabled;
  const keepAwakeEnabled =
    typeof candidate.keepAwakeEnabled === "boolean" ? candidate.keepAwakeEnabled : DEFAULT_SETTINGS.keepAwakeEnabled;
  const soundVolume =
    typeof candidate.soundVolume === "number" ? clampSoundVolume(candidate.soundVolume) : DEFAULT_SETTINGS.soundVolume;
  return { hapticsEnabled, keepAwakeEnabled, soundVolume };
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;
    async function loadSettings() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const parsed = parseSettings(JSON.parse(stored));
        if (parsed && isActive) setSettings(parsed);
      } catch {
      } finally {
        if (isActive) setIsHydrated(true);
      }
    }
    loadSettings();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [isHydrated, settings]);

  const value = useMemo(
    () => ({
      hapticsEnabled: settings.hapticsEnabled,
      keepAwakeEnabled: settings.keepAwakeEnabled,
      soundVolume: settings.soundVolume,
      setHapticsEnabled: (enabled: boolean) =>
        setSettings((current) => ({ ...current, hapticsEnabled: enabled })),
      setKeepAwakeEnabled: (enabled: boolean) =>
        setSettings((current) => ({ ...current, keepAwakeEnabled: enabled })),
      setSoundVolume: (volume: number) =>
        setSettings((current) => ({ ...current, soundVolume: clampSoundVolume(volume) })),
    }),
    [settings]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return context;
}

export function useAppSettingsOptional() {
  return useContext(AppSettingsContext);
}
