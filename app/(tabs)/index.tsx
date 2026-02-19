import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { validateTimerConfig } from "@/domain/validators/validateTimerConfig";

export default function ConfigScreen() {
  const router = useRouter();
  const [sets, setSets] = useState("5");
  const [exercise, setExercise] = useState("45");
  const [rest, setRest] = useState("15");

  function onStart() {
    try {
      const config = validateTimerConfig({
        sets: Number(sets),
        exerciseSeconds: Number(exercise),
        restSeconds: Number(rest),
        exerciseAutoAdvance: true,
        restAutoAdvance: true,
      });

      router.push({
        pathname: "/timer",
        params: {
          sets: String(config.sets),
          exerciseSeconds: String(config.exerciseSeconds),
          restSeconds: String(config.restSeconds),
          exerciseAutoAdvance: config.exerciseAutoAdvance ? "1" : "0",
          restAutoAdvance: config.restAutoAdvance ? "1" : "0",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocurrio un error inesperado.";
      Alert.alert("Error", message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurar intervalo</Text>

      <Text style={styles.label}>Numero de sets</Text>
      <TextInput style={styles.input} value={sets} onChangeText={setSets} keyboardType="number-pad" />

      <Text style={styles.label}>Ejercicio (segundos)</Text>
      <TextInput style={styles.input} value={exercise} onChangeText={setExercise} keyboardType="number-pad" />

      <Text style={styles.label}>Descanso (segundos)</Text>
      <TextInput style={styles.input} value={rest} onChangeText={setRest} keyboardType="number-pad" />

      <Pressable style={styles.primaryButton} onPress={onStart}>
        <Text style={styles.primaryButtonText}>Iniciar</Text>
      </Pressable>

      <Link href="/create-preset" asChild>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Crear preset</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10, backgroundColor: "white" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12 },
  primaryButton: { marginTop: 10, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: "#111" },
  primaryButtonText: { color: "white", fontWeight: "600" },
  secondaryButton: { padding: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#111" },
  secondaryButtonText: { color: "#111", fontWeight: "600" },
});
