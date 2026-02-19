import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { createPreset } from "@/domain/presets/createPreset";
import { usePresets } from "@/hooks/use-presets";

export default function CreatePresetScreen() {
  const router = useRouter();
  const { addPreset } = usePresets();
  const [name, setName] = useState("");
  const [sets, setSets] = useState("5");
  const [exercise, setExercise] = useState("45");
  const [rest, setRest] = useState("15");

  function onCreate() {
    try {
      const preset = createPreset({
        name,
        sets: Number(sets),
        exerciseSeconds: Number(exercise),
        restSeconds: Number(rest),
      });

      addPreset(preset);
      router.replace("/(tabs)/presets");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocurrió un error inesperado.";
      Alert.alert("Error", message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear preset</Text>

      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej. HIIT 45/15 x4" />

      <Text style={styles.label}>Número de sets</Text>
      <TextInput style={styles.input} value={sets} onChangeText={setSets} keyboardType="number-pad" />

      <Text style={styles.label}>Ejercicio (segundos)</Text>
      <TextInput style={styles.input} value={exercise} onChangeText={setExercise} keyboardType="number-pad" />

      <Text style={styles.label}>Descanso (segundos)</Text>
      <TextInput style={styles.input} value={rest} onChangeText={setRest} keyboardType="number-pad" />

      <Pressable style={styles.button} onPress={onCreate}>
        <Text style={styles.buttonText}>Crear</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10, backgroundColor: "white" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12 },
  button: { marginTop: 12, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: "#111" },
  buttonText: { color: "white", fontWeight: "600" },
});
