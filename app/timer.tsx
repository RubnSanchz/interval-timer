import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { validateTimerConfig } from "@/domain/validators/validateTimerConfig";
import { formatTime } from "@/utils/formatTime";

type Phase = "exercise" | "rest" | "done";
type Status = "idle" | "running" | "paused" | "done";

export default function TimerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sets?: string | string[];
    exerciseSeconds?: string | string[];
    restSeconds?: string | string[];
  }>();

  const configResult = useMemo(() => {
    const rawSets = Array.isArray(params.sets) ? params.sets[0] : params.sets;
    const rawExercise = Array.isArray(params.exerciseSeconds) ? params.exerciseSeconds[0] : params.exerciseSeconds;
    const rawRest = Array.isArray(params.restSeconds) ? params.restSeconds[0] : params.restSeconds;
    const candidate = {
      sets: Number(rawSets),
      exerciseSeconds: Number(rawExercise),
      restSeconds: Number(rawRest),
    };

    try {
      return { config: validateTimerConfig(candidate), error: null as string | null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Configuracion invalida.";
      return { config: null, error: message };
    }
  }, [params.exerciseSeconds, params.restSeconds, params.sets]);

  if (!configResult.config) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: "Timer" }} />
        <Text style={styles.title}>Configuracion invalida</Text>
        <Text style={styles.errorText}>{configResult.error}</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const config = configResult.config;
  const [phase, setPhase] = useState<Phase>("exercise");
  const [setIndex, setSetIndex] = useState(1);
  const [remaining, setRemaining] = useState(config.exerciseSeconds);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    setPhase("exercise");
    setSetIndex(1);
    setRemaining(config.exerciseSeconds);
    setStatus("idle");
  }, [config.exerciseSeconds, config.restSeconds, config.sets]);

  useEffect(() => {
    if (status !== "running") return;
    const interval = setInterval(() => {
      setRemaining((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== "running") return;
    if (remaining > 0) return;

    if (phase === "exercise") {
      if (setIndex >= config.sets) {
        setPhase("done");
        setStatus("done");
        return;
      }

      if (config.restSeconds > 0) {
        setPhase("rest");
        setRemaining(config.restSeconds);
        return;
      }

      setSetIndex((current) => current + 1);
      setPhase("exercise");
      setRemaining(config.exerciseSeconds);
      return;
    }

    if (phase === "rest") {
      const nextSet = setIndex + 1;
      if (nextSet > config.sets) {
        setPhase("done");
        setStatus("done");
        return;
      }

      setSetIndex(nextSet);
      setPhase("exercise");
      setRemaining(config.exerciseSeconds);
    }
  }, [config.exerciseSeconds, config.restSeconds, config.sets, phase, remaining, setIndex, status]);

  function resetTimer() {
    setPhase("exercise");
    setSetIndex(1);
    setRemaining(config.exerciseSeconds);
    setStatus("idle");
  }

  function startTimer() {
    if (status === "idle" || status === "paused") setStatus("running");
  }

  function pauseTimer() {
    if (status === "running") setStatus("paused");
  }

  const phaseLabel =
    phase === "exercise" ? "Ejercicio" : phase === "rest" ? "Descanso" : "Completado";

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Timer" }} />
      <Text style={styles.title}>Intervalo en curso</Text>
      <Text style={styles.phase}>{phaseLabel}</Text>
      <Text style={styles.timer}>{formatTime(remaining)}</Text>
      <Text style={styles.meta}>
        Set {Math.min(setIndex, config.sets)} de {config.sets}
      </Text>

      <View style={styles.controls}>
        {status === "idle" && (
          <Pressable style={styles.primaryButton} onPress={startTimer}>
            <Text style={styles.primaryButtonText}>Iniciar</Text>
          </Pressable>
        )}
        {status === "running" && (
          <Pressable style={styles.secondaryButton} onPress={pauseTimer}>
            <Text style={styles.secondaryButtonText}>Pausar</Text>
          </Pressable>
        )}
        {status === "paused" && (
          <Pressable style={styles.primaryButton} onPress={startTimer}>
            <Text style={styles.primaryButtonText}>Reanudar</Text>
          </Pressable>
        )}
        {status !== "idle" && (
          <Pressable style={styles.ghostButton} onPress={resetTimer}>
            <Text style={styles.ghostButtonText}>Reiniciar</Text>
          </Pressable>
        )}
      </View>

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Volver</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white", alignItems: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: "600", marginTop: 12 },
  phase: { fontSize: 18, fontWeight: "500", color: "#444" },
  timer: { fontSize: 52, fontWeight: "700", letterSpacing: 1 },
  meta: { fontSize: 14, color: "#666" },
  controls: { width: "100%", gap: 10, marginTop: 10 },
  primaryButton: { padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: "#111" },
  primaryButtonText: { color: "white", fontWeight: "600" },
  secondaryButton: { padding: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#111" },
  secondaryButtonText: { color: "#111", fontWeight: "600" },
  ghostButton: { padding: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#bbb" },
  ghostButtonText: { color: "#444", fontWeight: "600" },
  backButton: { marginTop: "auto", padding: 12 },
  backButtonText: { color: "#111", fontWeight: "600" },
  errorContainer: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 14, color: "#666", textAlign: "center" },
});
