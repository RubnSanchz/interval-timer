import { IconSymbol } from "@/components/ui/icon-symbol";
import type { TimerConfig } from "@/domain/models/TimerConfig";
import { validateTimerConfig } from "@/domain/validators/validateTimerConfig";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useFeedback } from "@/hooks/use-feedback";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
 clearTimerNotifications,
 isTimerNotificationResponse,
 prepareTimerNotifications,
 scheduleTimerNotifications as scheduleBackgroundTimerNotifications,
 TIMER_NOTIFICATION_ACTIONS,
 type TimerNotificationState,
} from "@/services/timer-notifications";
import { formatTime } from "@/utils/formatTime";
import * as Notifications from "expo-notifications";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import type { AppStateStatus } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PREP_SECONDS = 5;

type Phase = "prep" | "exercise" | "rest" | "done";
type Status = "running" | "paused" | "holding" | "done";
type PendingTransition = { phase: "exercise" | "rest"; setIndex: number; remaining: number };
type TimerSnapshot = TimerNotificationState;

function advanceTimerBySeconds(snapshot: TimerSnapshot, config: TimerConfig, elapsedSeconds: number): TimerSnapshot {
 if (elapsedSeconds <= 0) return snapshot;
 if (snapshot.status !== "running") return snapshot;

 let { phase, setIndex, remaining } = snapshot;
 let status: Status = snapshot.status;
 let pending: PendingTransition | null = snapshot.pending;
 let secondsLeft = elapsedSeconds;

 if (pending) pending = null;
 if (remaining < 0) remaining = 0;

 while (secondsLeft > 0 && status === "running") {
  if (remaining > 0) {
   if (secondsLeft < remaining) {
    remaining -= secondsLeft;
    secondsLeft = 0;
    break;
   }
   secondsLeft -= remaining;
   remaining = 0;
   if (secondsLeft === 0) break;
  }

  if (phase === "prep") {
   phase = "exercise";
   remaining = config.exerciseSeconds;
   continue;
  }

  if (phase === "exercise") {
   if (setIndex >= config.sets) {
    phase = "done";
    status = "done";
    pending = null;
    remaining = 0;
    break;
   }

   const nextPhase =
    config.restSeconds > 0
     ? { phase: "rest" as const, setIndex, remaining: config.restSeconds }
     : { phase: "exercise" as const, setIndex: setIndex + 1, remaining: config.exerciseSeconds };

   if (config.exerciseAutoAdvance) {
    phase = nextPhase.phase;
    setIndex = nextPhase.setIndex;
    remaining = nextPhase.remaining;
    continue;
   }

   pending = nextPhase;
   status = "holding";
   break;
  }

  if (phase === "rest") {
   const nextSet = setIndex + 1;
   if (nextSet > config.sets) {
    phase = "done";
    status = "done";
    pending = null;
    remaining = 0;
    break;
   }

   const nextPhase = { phase: "exercise" as const, setIndex: nextSet, remaining: config.exerciseSeconds };
   if (config.restAutoAdvance) {
    phase = nextPhase.phase;
    setIndex = nextPhase.setIndex;
    remaining = nextPhase.remaining;
    continue;
   }

   pending = nextPhase;
   status = "holding";
   break;
  }

  phase = "done";
  status = "done";
  pending = null;
  remaining = 0;
  break;
 }

 return { phase, setIndex, remaining, status, pending };
}

export default function TimerScreen() {
 const router = useRouter();
 const backgroundColor = useThemeColor({}, "background");
 const textColor = useThemeColor({}, "text");
 const mutedTextColor = useThemeColor({ light: "#666", dark: "#9ba1a6" }, "text");
 const primaryBackground = useThemeColor({ light: "#111", dark: "#ECEDEE" }, "text");
 const primaryText = useThemeColor({ light: "white", dark: "#111" }, "text");
 const secondaryBorder = useThemeColor({ light: "#111", dark: "#ECEDEE" }, "text");
 const secondaryText = useThemeColor({ light: "#111", dark: "#ECEDEE" }, "text");
 const ghostBorder = useThemeColor({ light: "#bbb", dark: "#333" }, "text");
 const ghostText = useThemeColor({ light: "#444", dark: "#9ba1a6" }, "text");
 const ghostBackground = useThemeColor({ light: "#F3F4F6", dark: "#1E2023" }, "background");
 const { playBeep } = useFeedback();
 const { keepAwakeEnabled } = useAppSettings();
 const params = useLocalSearchParams<{
  sets?: string | string[];
  exerciseSeconds?: string | string[];
  restSeconds?: string | string[];
  exerciseAutoAdvance?: string | string[];
  restAutoAdvance?: string | string[];
 }>();

 const configResult = useMemo(() => {
  const rawSets = Array.isArray(params.sets) ? params.sets[0] : params.sets;
  const rawExercise = Array.isArray(params.exerciseSeconds) ? params.exerciseSeconds[0] : params.exerciseSeconds;
  const rawRest = Array.isArray(params.restSeconds) ? params.restSeconds[0] : params.restSeconds;
  const rawExerciseAuto = Array.isArray(params.exerciseAutoAdvance)
   ? params.exerciseAutoAdvance[0]
   : params.exerciseAutoAdvance;
  const rawRestAuto = Array.isArray(params.restAutoAdvance) ? params.restAutoAdvance[0] : params.restAutoAdvance;

  const candidate = {
   sets: Number(rawSets),
   exerciseSeconds: Number(rawExercise),
   restSeconds: Number(rawRest),
   exerciseAutoAdvance: rawExerciseAuto === "0" || rawExerciseAuto === "false" ? false : true,
   restAutoAdvance: rawRestAuto === "0" || rawRestAuto === "false" ? false : true,
  };

  try {
   return { config: validateTimerConfig(candidate), error: null as string | null };
  } catch (error) {
   const message = error instanceof Error ? error.message : "Configuracion invalida.";
   return { config: null, error: message };
  }
 }, [params.exerciseSeconds, params.restSeconds, params.sets, params.exerciseAutoAdvance, params.restAutoAdvance]);

 if (!configResult.config) {
  return (
   <View style={StyleSheet.flatten([styles.errorContainer, { backgroundColor }])}>
    <Stack.Screen options={{ title: "Timer" }} />
    <Text style={StyleSheet.flatten([styles.title, { color: textColor }])}>Configuracion invalida</Text>
    <Text style={StyleSheet.flatten([styles.errorText, { color: mutedTextColor }])}>{configResult.error}</Text>
    <Pressable
     style={StyleSheet.flatten([styles.primaryButton, { backgroundColor: primaryBackground }])}
     onPress={() => router.back()}
    >
     <Text style={StyleSheet.flatten([styles.primaryButtonText, { color: primaryText }])}>Volver</Text>
    </Pressable>
   </View>
  );
 }

 const config = configResult.config;
 const [phase, setPhase] = useState<Phase>(PREP_SECONDS > 0 ? "prep" : "exercise");
 const [setIndex, setSetIndex] = useState(1);
 const [remaining, setRemaining] = useState(PREP_SECONDS > 0 ? PREP_SECONDS : config.exerciseSeconds);
 const [status, setStatus] = useState<Status>("running");
 const [pending, setPending] = useState<PendingTransition | null>(null);
 const lastBeepKey = useRef<string | null>(null);
 const previousRemaining = useRef<number>(remaining);
 const timerStateRef = useRef<TimerSnapshot>({ phase, setIndex, remaining, status, pending });
 const lastTickAtRef = useRef<number | null>(null);
 const configRef = useRef(config);
 const notificationsEnabledRef = useRef(false);
 const appStateRef = useRef<AppStateStatus>(AppState.currentState);
 const scheduledNotificationIdsRef = useRef<string[]>([]);
 const statusNotificationIdRef = useRef<string | null>(null);
 const pauseTimerRef = useRef<() => void>(() => {});
 const skipSetRef = useRef<() => void>(() => {});

 const resetTickClock = useCallback(() => {
  lastTickAtRef.current = Date.now();
 }, []);

 const cancelBackgroundNotifications = useCallback(async () => {
  const scheduledIds = scheduledNotificationIdsRef.current;
  const statusId = statusNotificationIdRef.current;
  if (scheduledIds.length === 0 && !statusId) return;
  await clearTimerNotifications(scheduledIds, statusId);
  scheduledNotificationIdsRef.current = [];
  statusNotificationIdRef.current = null;
 }, []);

 const scheduleBackgroundNotifications = useCallback(async () => {
  if (!notificationsEnabledRef.current) return;
  if (appStateRef.current === "active") return;
  const snapshot = timerStateRef.current;
  if (snapshot.status !== "running") return;
  await cancelBackgroundNotifications();
  const configValue = configRef.current;
  if (!configValue) return;
  const result = await scheduleBackgroundTimerNotifications({ config: configValue, snapshot });
  scheduledNotificationIdsRef.current = result.scheduledIds;
  statusNotificationIdRef.current = result.statusNotificationId;
 }, [cancelBackgroundNotifications]);

 useEffect(() => {
  timerStateRef.current = { phase, setIndex, remaining, status, pending };
 }, [phase, setIndex, remaining, status, pending]);

 useEffect(() => {
  configRef.current = config;
 }, [config]);

 useEffect(() => {
  let isActive = true;
  prepareTimerNotifications()
   .then((enabled) => {
    if (isActive) notificationsEnabledRef.current = enabled;
   })
   .catch(() => {
    if (isActive) notificationsEnabledRef.current = false;
   });
  return () => {
   isActive = false;
  };
 }, []);

 useEffect(() => {
  const subscription = AppState.addEventListener("change", (nextState) => {
   const previousState = appStateRef.current;
   appStateRef.current = nextState;
   if (nextState === "active") {
    void cancelBackgroundNotifications();
    return;
   }
   if (previousState === "active") {
    void scheduleBackgroundNotifications();
   }
  });
  return () => subscription.remove();
 }, [cancelBackgroundNotifications, scheduleBackgroundNotifications]);

 useEffect(() => {
  if (status === "running") return;
  void cancelBackgroundNotifications();
 }, [status, cancelBackgroundNotifications]);

 useEffect(() => {
  return () => {
   void cancelBackgroundNotifications();
  };
 }, [cancelBackgroundNotifications]);

 useEffect(() => {
  if (status === "running") {
   if (!lastTickAtRef.current) lastTickAtRef.current = Date.now();
   return;
  }
  lastTickAtRef.current = null;
 }, [status]);

 useEffect(() => {
  setPhase(PREP_SECONDS > 0 ? "prep" : "exercise");
  setSetIndex(1);
  setRemaining(PREP_SECONDS > 0 ? PREP_SECONDS : config.exerciseSeconds);
  setStatus("running");
  setPending(null);
  resetTickClock();
 }, [
  config.exerciseSeconds,
  config.restSeconds,
  config.sets,
  config.exerciseAutoAdvance,
  config.restAutoAdvance,
  resetTickClock,
 ]);

 useEffect(() => {
  if (status !== "running") return;
  const interval = setInterval(() => {
   const current = timerStateRef.current;
   if (current.status !== "running") return;
   const now = Date.now();
   const lastTickAt = lastTickAtRef.current ?? now;
   const elapsedMs = now - lastTickAt;
   if (elapsedMs < 0) {
    lastTickAtRef.current = now;
    return;
   }
   if (elapsedMs < 1000) return;
   const elapsedSeconds = Math.floor(elapsedMs / 1000);
   lastTickAtRef.current = lastTickAt + elapsedSeconds * 1000;
   const nextState = advanceTimerBySeconds(current, config, elapsedSeconds);
   if (
    nextState.phase === current.phase &&
    nextState.setIndex === current.setIndex &&
    nextState.remaining === current.remaining &&
    nextState.status === current.status &&
    nextState.pending === current.pending
   ) {
    return;
   }
   setPhase(nextState.phase);
   setSetIndex(nextState.setIndex);
   setRemaining(nextState.remaining);
   setStatus(nextState.status);
   setPending(nextState.pending);
  }, 1000);
  return () => clearInterval(interval);
 }, [config, status]);

 useEffect(() => {
  const shouldKeepAwake = keepAwakeEnabled && (status === "running" || status === "holding");
  if (shouldKeepAwake) {
   activateKeepAwake("interval-timer");
  } else {
   deactivateKeepAwake("interval-timer");
  }
  return () => {
   deactivateKeepAwake("interval-timer");
  };
 }, [keepAwakeEnabled, status]);

 useEffect(() => {
  if (remaining > previousRemaining.current) {
   lastBeepKey.current = null;
  }
  previousRemaining.current = remaining;
 }, [remaining]);

 useEffect(() => {
  if (phase === "prep" || phase === "done") return;
  if (status === "paused") return;

  let beepKind: "short" | "long" | null = null;
  if (phase === "rest" && (remaining === 2 || remaining === 1 || remaining === 0)) {
   beepKind = "short";
  } else if (phase === "exercise") {
   if (remaining === 2 || remaining === 1) beepKind = "short";
   if (remaining === 0) beepKind = "long";
  }

  if (!beepKind) return;
  if (remaining > 0 && status !== "running") return;

  const key = `${phase}:${remaining}:${beepKind}`;
  if (lastBeepKey.current === key) return;
  lastBeepKey.current = key;
  playBeep(beepKind);
 }, [phase, remaining, status, playBeep]);

 useEffect(() => {
  if (status !== "running") return;
  if (remaining > 0) return;

  if (phase === "prep") {
   setPhase("exercise");
   setRemaining(config.exerciseSeconds);
   return;
  }

  if (phase === "exercise") {
   if (setIndex >= config.sets) {
    setPhase("done");
    setStatus("done");
    setPending(null);
    return;
   }

   const nextPhase =
    config.restSeconds > 0
     ? { phase: "rest" as const, setIndex, remaining: config.restSeconds }
     : { phase: "exercise" as const, setIndex: setIndex + 1, remaining: config.exerciseSeconds };

   if (config.exerciseAutoAdvance) {
    setPhase(nextPhase.phase);
    setSetIndex(nextPhase.setIndex);
    setRemaining(nextPhase.remaining);
   } else {
    setPending(nextPhase);
    setStatus("holding");
   }
   return;
  }

  if (phase === "rest") {
   const nextSet = setIndex + 1;
   if (nextSet > config.sets) {
    setPhase("done");
    setStatus("done");
    setPending(null);
    return;
   }

   const nextPhase = { phase: "exercise" as const, setIndex: nextSet, remaining: config.exerciseSeconds };
   if (config.restAutoAdvance) {
    setPhase(nextPhase.phase);
    setSetIndex(nextPhase.setIndex);
    setRemaining(nextPhase.remaining);
   } else {
    setPending(nextPhase);
    setStatus("holding");
   }
  }
 }, [
  config.exerciseSeconds,
  config.restSeconds,
  config.sets,
  config.exerciseAutoAdvance,
  config.restAutoAdvance,
  phase,
  remaining,
  setIndex,
  status,
 ]);

 function resetTimer() {
  setPhase(PREP_SECONDS > 0 ? "prep" : "exercise");
  setSetIndex(1);
  setRemaining(PREP_SECONDS > 0 ? PREP_SECONDS : config.exerciseSeconds);
  setStatus("running");
  setPending(null);
  resetTickClock();
 }

 function resetSet() {
  setPhase("exercise");
  setRemaining(config.exerciseSeconds);
  setStatus("running");
  setPending(null);
  resetTickClock();
 }

 function skipSet() {
  if (status === "done") return;

  if (phase === "prep") {
   setPhase("exercise");
   setSetIndex(1);
   setRemaining(config.exerciseSeconds);
   setStatus("running");
   setPending(null);
   resetTickClock();
   return;
  }

  if (phase === "exercise") {
   if (config.restSeconds > 0) {
    setPhase("rest");
    setRemaining(config.restSeconds);
    setStatus("running");
    setPending(null);
    resetTickClock();
    return;
   }

   const nextSet = setIndex + 1;
   if (nextSet > config.sets) {
    setPhase("done");
    setStatus("done");
    setPending(null);
    return;
   }

   setPhase("exercise");
   setSetIndex(nextSet);
   setRemaining(config.exerciseSeconds);
   setStatus("running");
   setPending(null);
   resetTickClock();
   return;
  }

  const nextSet = setIndex + 1;
  if (nextSet > config.sets) {
   setPhase("done");
   setStatus("done");
   setPending(null);
   return;
  }

  setPhase("exercise");
  setSetIndex(nextSet);
  setRemaining(config.exerciseSeconds);
  setStatus("running");
  setPending(null);
  resetTickClock();
 }

 function pauseTimer() {
  if (status === "running") setStatus("paused");
 }

 function resumeTimer() {
  if (status !== "paused") return;
  setStatus("running");
  resetTickClock();
 }

 function continueTimer() {
  if (status !== "holding" || !pending) return;
  setPhase(pending.phase);
  setSetIndex(pending.setIndex);
  setRemaining(pending.remaining);
  setPending(null);
  setStatus("running");
  resetTickClock();
 }

 useEffect(() => {
  pauseTimerRef.current = pauseTimer;
  skipSetRef.current = skipSet;
 }, [pauseTimer, skipSet]);

 useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
   if (!isTimerNotificationResponse(response)) return;
   if (response.actionIdentifier === TIMER_NOTIFICATION_ACTIONS.PAUSE) {
    pauseTimerRef.current();
    void cancelBackgroundNotifications();
    return;
   }
   if (response.actionIdentifier === TIMER_NOTIFICATION_ACTIONS.SKIP) {
    skipSetRef.current();
   }
  });
  return () => subscription.remove();
 }, [cancelBackgroundNotifications]);

 const timerTextColor = phase === "prep" ? mutedTextColor : textColor;
 const phaseLabel =
  phase === "prep" ? "Preparación" : phase === "exercise" ? "Ejercicio" : phase === "rest" ? "Descanso" : "Completado";

 return (
  <SafeAreaView style={StyleSheet.flatten([styles.screen, { backgroundColor }])} edges={["top", "bottom"]}>
   <View style={styles.container}>
    <Stack.Screen options={{ title: "Timer" }} />
    <Text style={StyleSheet.flatten([styles.title, { color: textColor }])}>Intervalo en curso</Text>
    <Text style={StyleSheet.flatten([styles.phase, { color: mutedTextColor }])}>{phaseLabel}</Text>
    <Text style={StyleSheet.flatten([styles.timer, { color: timerTextColor }])}>{formatTime(remaining)}</Text>
    <Text style={StyleSheet.flatten([styles.meta, { color: mutedTextColor }])}>
     Set {Math.min(setIndex, config.sets)} / {config.sets}
    </Text>

    <View style={styles.controls}>
     {status === "done" ? (
      <Pressable
       style={StyleSheet.flatten([styles.primaryButton, { backgroundColor: primaryBackground }])}
       onPress={resetTimer}
      >
       <View style={styles.buttonContent}>
        <IconSymbol name="arrow.counterclockwise" size={20} color={primaryText} style={styles.iconSmall} />
        <Text style={StyleSheet.flatten([styles.primaryButtonText, { color: primaryText }])}>Reiniciar</Text>
       </View>
      </Pressable>
     ) : (
      <>
       <View style={styles.controlsRow}>
        {status === "running" && (
         <Pressable
          style={StyleSheet.flatten([styles.secondaryButton, styles.controlFull, { borderColor: secondaryBorder }])}
          onPress={pauseTimer}
          accessibilityLabel="Pausar"
         >
          <View style={styles.iconOnly}>
           <IconSymbol name="pause.fill" size={24} color={secondaryText} style={styles.iconLarge} />
          </View>
         </Pressable>
        )}
        {status === "paused" && (
         <Pressable
          style={StyleSheet.flatten([styles.primaryButton, styles.controlFull, { backgroundColor: primaryBackground }])}
          onPress={resumeTimer}
          accessibilityLabel="Reanudar"
         >
          <View style={styles.iconOnly}>
           <IconSymbol name="play.fill" size={24} color={primaryText} style={styles.iconLarge} />
          </View>
         </Pressable>
        )}
        {status === "holding" && (
         <Pressable
          style={StyleSheet.flatten([styles.primaryButton, styles.controlFull, { backgroundColor: primaryBackground }])}
          onPress={continueTimer}
          accessibilityLabel="Continuar"
         >
          <View style={styles.iconOnly}>
           <IconSymbol name="play.fill" size={24} color={primaryText} style={styles.iconLarge} />
          </View>
         </Pressable>
        )}
       </View>
       <View style={styles.controlsRow}>
        <Pressable
         style={StyleSheet.flatten([
          styles.ghostButton,
          styles.controlThird,
          { borderColor: ghostBorder, backgroundColor: ghostBackground },
         ])}
         onPress={resetSet}
        >
         <View style={styles.buttonStack}>
          <IconSymbol name="repeat" size={18} color={ghostText} style={styles.iconSmall} />
          <Text style={StyleSheet.flatten([styles.ghostButtonText, { color: ghostText }])}>Reiniciar set</Text>
         </View>
        </Pressable>
        <Pressable
         style={StyleSheet.flatten([
          styles.ghostButton,
          styles.controlThird,
          { borderColor: ghostBorder, backgroundColor: ghostBackground },
         ])}
         onPress={resetTimer}
        >
         <View style={styles.buttonStack}>
          <IconSymbol name="arrow.counterclockwise" size={18} color={ghostText} style={styles.iconSmall} />
          <Text style={StyleSheet.flatten([styles.ghostButtonText, { color: ghostText }])}>Reiniciar ejercicio</Text>
         </View>
        </Pressable>
        <Pressable
         style={StyleSheet.flatten([
          styles.ghostButton,
          styles.controlThird,
          { borderColor: ghostBorder, backgroundColor: ghostBackground },
         ])}
         onPress={skipSet}
         accessibilityLabel="Saltar set"
        >
         <View style={styles.iconOnly}>
          <IconSymbol name="forward.end.fill" size={20} color={ghostText} style={styles.iconSmall} />
         </View>
        </Pressable>
       </View>
      </>
     )}
    </View>

    <Pressable style={styles.backButton} onPress={() => router.back()}>
     <Text style={StyleSheet.flatten([styles.backButtonText, { color: textColor }])}>Volver</Text>
    </Pressable>
   </View>
  </SafeAreaView>
 );
}

const styles = StyleSheet.create({
 screen: { flex: 1 },
 container: {
  flex: 1,
  padding: 20,
  alignItems: "center",
  gap: 12,
  width: "100%",
  maxWidth: 520,
  alignSelf: "center",
 },
 title: { fontSize: 20, fontWeight: "600", letterSpacing: 0.2, marginTop: 12 },
 phase: { fontSize: 16, fontWeight: "600", letterSpacing: 0.4, color: "#444" },
 timer: { fontSize: 60, fontWeight: "700", letterSpacing: 1.5 },
 meta: { fontSize: 12, letterSpacing: 0.2, color: "#666" },
 controls: { width: "100%", gap: 12, marginTop: 14 },
 controlsRow: { width: "100%", flexDirection: "row", gap: 10 },
 controlFull: { flex: 1 },
 controlThird: { flex: 1 },
 buttonContent: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
 },
 buttonStack: {
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
 },
 iconOnly: { alignItems: "center", justifyContent: "center" },
 iconLarge: { lineHeight: 24, textAlignVertical: "center" },
 iconSmall: { lineHeight: 18, textAlignVertical: "center" },
 primaryButton: {
  paddingHorizontal: 16,
  paddingVertical: 0,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  minHeight: 52,
  backgroundColor: "#111",
 },
 primaryButtonText: { color: "white", fontWeight: "600", fontSize: 14, lineHeight: 18, textAlign: "center" },
 secondaryButton: {
  paddingHorizontal: 16,
  paddingVertical: 0,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  minHeight: 52,
  borderWidth: 1,
  borderColor: "#111",
 },
 secondaryButtonText: { color: "#111", fontWeight: "600", fontSize: 14, lineHeight: 18, textAlign: "center" },
 ghostButton: {
  paddingHorizontal: 14,
  paddingVertical: 0,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  minHeight: 52,
  borderWidth: 1,
  borderColor: "#bbb",
 },
 ghostButtonText: { color: "#444", fontWeight: "600", fontSize: 12, lineHeight: 14, textAlign: "center" },
 backButton: { marginTop: "auto", padding: 12 },
 backButtonText: { color: "#111", fontWeight: "600" },
 errorContainer: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center", gap: 12 },
 errorText: { fontSize: 14, color: "#666", textAlign: "center" },
});
