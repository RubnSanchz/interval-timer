import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useAppSettings } from "@/hooks/use-app-settings";

type FeedbackKind = "phase" | "hold" | "complete";

const BEEP_SOUND = require("../assets/sounds/beep.wav");

export function useFeedback() {
  const { hapticsEnabled, soundVolume } = useAppSettings();
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let isActive = true;
    async function loadSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(BEEP_SOUND, {
          volume: soundVolume,
          shouldPlay: false,
        });
        if (!isActive) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
      } catch {
      }
    }
    loadSound();
    return () => {
      isActive = false;
      const sound = soundRef.current;
      soundRef.current = null;
      sound?.unloadAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!soundRef.current) return;
    soundRef.current.setVolumeAsync(soundVolume).catch(() => {});
  }, [soundVolume]);

  const playSound = useCallback(async () => {
    if (soundVolume <= 0) return;
    const sound = soundRef.current;
    if (!sound) {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(BEEP_SOUND, {
          volume: soundVolume,
          shouldPlay: true,
        });
        soundRef.current = newSound;
      } catch {
      }
      return;
    }
    try {
      await sound.replayAsync();
    } catch {
    }
  }, [soundVolume]);

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
      void playSound();
    },
    [playSound, triggerHaptics]
  );

  return { triggerFeedback };
}
