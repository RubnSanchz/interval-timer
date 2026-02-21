import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform } from "react-native";
import { useAppSettings } from "@/hooks/use-app-settings";

type FeedbackKind = "phase" | "hold" | "complete";
type BeepKind = "short" | "long";

const SHORT_BEEP = require("../assets/sounds/beep-short.wav");
const LONG_BEEP = require("../assets/sounds/beep-long.wav");
const VOLUME_GAMMA = 1.6;

type SoundRefs = {
  short: Audio.Sound | null;
  long: Audio.Sound | null;
};

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function scaleVolume(value: number) {
  const clamped = clampVolume(value);
  if (clamped <= 0) return 0;
  return Math.min(1, Math.pow(clamped, VOLUME_GAMMA));
}

export function useFeedback() {
  const { hapticsEnabled, soundVolume } = useAppSettings();
  const soundRefs = useRef<SoundRefs>({ short: null, long: null });
  const effectiveVolume = useMemo(() => scaleVolume(soundVolume), [soundVolume]);
  const initialVolume = useRef(effectiveVolume);

  useEffect(() => {
    let isActive = true;
    async function loadSound(kind: BeepKind, asset: number) {
      try {
        const { sound } = await Audio.Sound.createAsync(asset, {
          volume: initialVolume.current,
          shouldPlay: false,
        });
        if (!isActive) {
          await sound.unloadAsync();
          return;
        }
        soundRefs.current[kind] = sound;
      } catch {
      }
    }
    loadSound("short", SHORT_BEEP);
    loadSound("long", LONG_BEEP);
    return () => {
      isActive = false;
      const current = soundRefs.current;
      soundRefs.current = { short: null, long: null };
      current.short?.unloadAsync().catch(() => {});
      current.long?.unloadAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const current = soundRefs.current;
    current.short?.setVolumeAsync(effectiveVolume).catch(() => {});
    current.long?.setVolumeAsync(effectiveVolume).catch(() => {});
  }, [effectiveVolume]);

  const triggerBeepHaptics = useCallback(
    async (kind: BeepKind) => {
      if (!hapticsEnabled) return;
      if (Platform.OS === "web") return;
      try {
        if (kind === "long") {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          return;
        }
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
      }
    },
    [hapticsEnabled]
  );

  const playBeep = useCallback(
    async (kind: BeepKind) => {
      void triggerBeepHaptics(kind);
      if (effectiveVolume <= 0) return;
      const sound = soundRefs.current[kind];
      if (!sound) {
        try {
          const asset = kind === "short" ? SHORT_BEEP : LONG_BEEP;
          const { sound: newSound } = await Audio.Sound.createAsync(asset, {
            volume: effectiveVolume,
            shouldPlay: true,
          });
          soundRefs.current[kind] = newSound;
        } catch {
        }
        return;
      }
      try {
        await sound.replayAsync();
      } catch {
      }
    },
    [effectiveVolume, triggerBeepHaptics]
  );

  const triggerHaptics = useCallback(
    async (kind: FeedbackKind) => {
      if (!hapticsEnabled) return;
      if (Platform.OS === "web") return;
      try {
        if (kind === "complete") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return;
        }
        if (kind === "hold") {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return;
        }
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
      }
    },
    [hapticsEnabled]
  );

  const triggerFeedback = useCallback(
    (kind: FeedbackKind) => {
      void triggerHaptics(kind);
    },
    [triggerHaptics]
  );

  return { triggerFeedback, playBeep };
}
