import { IconSymbol } from "@/components/ui/icon-symbol";
import { validateTimerConfig } from "@/domain/validators/validateTimerConfig";
import { useFeedback } from "@/hooks/use-feedback";
import { useThemeColor } from "@/hooks/use-theme-color";
import { formatTime } from "@/utils/formatTime";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const PREP_SECONDS = 5;

type Phase = "prep" | "exercise" | "rest" | "done";
type Status = "running" | "paused" | "holding" | "done";
type PendingTransition = { phase: "exercise" | "rest"; setIndex: number; remaining: number };

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

 useEffect(() => {
  setPhase(PREP_SECONDS > 0 ? "prep" : "exercise");
  setSetIndex(1);
  setRemaining(PREP_SECONDS > 0 ? PREP_SECONDS : config.exerciseSeconds);
  setStatus("running");
  setPending(null);
 }, [config.exerciseSeconds, config.restSeconds, config.sets, config.exerciseAutoAdvance, config.restAutoAdvance]);

 useEffect(() => {
  if (status !== "running") return;
  const interval = setInterval(() => {
   setRemaining((current) => (current > 0 ? current - 1 : 0));
  }, 1000);
  return () => clearInterval(interval);
 }, [status]);

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
 }

 function resetSet() {
  setPhase("exercise");
  setRemaining(config.exerciseSeconds);
  setStatus("running");
  setPending(null);
 }

 function skipSet() {
  if (status === "done") return;

  if (phase === "prep") {
   setPhase("exercise");
   setSetIndex(1);
   setRemaining(config.exerciseSeconds);
   setStatus("running");
   setPending(null);
   return;
  }

  if (phase === "exercise") {
   if (config.restSeconds > 0) {
    setPhase("rest");
    setRemaining(config.restSeconds);
    setStatus("running");
    setPending(null);
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
 }

 function pauseTimer() {
  if (status === "running") setStatus("paused");
 }

 function resumeTimer() {
  if (status === "paused") setStatus("running");
 }

 function continueTimer() {
  if (status !== "holding" || !pending) return;
  setPhase(pending.phase);
  setSetIndex(pending.setIndex);
  setRemaining(pending.remaining);
  setPending(null);
  setStatus("running");
 }

 const timerTextColor = phase === "prep" ? mutedTextColor : textColor;
 const phaseLabel =
  phase === "prep" ? "Preparacion" : phase === "exercise" ? "Ejercicio" : phase === "rest" ? "Descanso" : "Completado";

 return (
  <View style={StyleSheet.flatten([styles.screen, { backgroundColor }])}>
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
  </View>
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
  height: "100%",
  width: "100%",
  gap: 8,
 },
 buttonStack: {
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  width: "100%",
  gap: 6,
 },
 iconOnly: { alignItems: "center", justifyContent: "center", height: "100%", width: "100%" },
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
