import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { createPreset } from "@/domain/presets/createPreset";
import { usePresets } from "@/hooks/use-presets";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function CreatePresetScreen() {
  const router = useRouter();
  const { addPreset } = usePresets();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({ light: "#ccc", dark: "#333" }, "text");
  const inputBackground = useThemeColor({ light: "white", dark: "#1c1d1f" }, "background");
  const primaryBackground = useThemeColor({ light: "#111", dark: "#ECEDEE" }, "text");
  const primaryText = useThemeColor({ light: "white", dark: "#111" }, "text");
  const secondaryText = useThemeColor({ light: "#111", dark: "#ECEDEE" }, "text");
  const placeholderColor = useThemeColor({ light: "#9aa0a6", dark: "#6d737a" }, "text");
  const [name, setName] = useState("");
  const [sets, setSets] = useState("5");
  const [exercise, setExercise] = useState("45");
  const [rest, setRest] = useState("15");
  const [exerciseAutoAdvance, setExerciseAutoAdvance] = useState(true);
  const [restAutoAdvance, setRestAutoAdvance] = useState(true);

  function onCreate() {
    try {
      const preset = createPreset({
        name,
        sets: Number(sets),
        exerciseSeconds: Number(exercise),
        restSeconds: Number(rest),
        exerciseAutoAdvance,
        restAutoAdvance,
      });

      addPreset(preset);
      router.replace("/(tabs)/presets");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocurrio un error inesperado.";
      Alert.alert("Error", message);
    }
  }

  return (
    <View style={StyleSheet.flatten([styles.screen, { backgroundColor }])}>
      <View style={styles.container}>
        <Text style={StyleSheet.flatten([styles.title, { color: textColor }])}>Crear preset</Text>

        <Text style={StyleSheet.flatten([styles.label, { color: textColor }])}>Nombre</Text>
        <TextInput
          style={StyleSheet.flatten([
            styles.input,
            { borderColor, backgroundColor: inputBackground, color: textColor },
          ])}
          value={name}
          onChangeText={setName}
          placeholder="Ej. HIIT 45/15 x4"
          placeholderTextColor={placeholderColor}
        />

        <Text style={StyleSheet.flatten([styles.label, { color: textColor }])}>Número de sets</Text>
        <TextInput
          style={StyleSheet.flatten([
            styles.input,
            { borderColor, backgroundColor: inputBackground, color: textColor },
          ])}
          value={sets}
          onChangeText={setSets}
          keyboardType="number-pad"
        />

        <Text style={StyleSheet.flatten([styles.label, { color: textColor }])}>Ejercicio (segundos)</Text>
        <View style={styles.row}>
          <TextInput
            style={StyleSheet.flatten([
              styles.input,
              styles.inputFlex,
              { borderColor, backgroundColor: inputBackground, color: textColor },
            ])}
            value={exercise}
            onChangeText={setExercise}
            keyboardType="number-pad"
          />
          <Pressable
            style={StyleSheet.flatten([
              styles.toggleButton,
              {
                backgroundColor: exerciseAutoAdvance ? primaryBackground : inputBackground,
                borderColor: exerciseAutoAdvance ? primaryBackground : borderColor,
              },
            ])}
            onPress={() => setExerciseAutoAdvance((current) => !current)}>
            <Text
              style={StyleSheet.flatten([
                styles.toggleButtonText,
                { color: exerciseAutoAdvance ? primaryText : secondaryText },
              ])}>
              {exerciseAutoAdvance ? "Auto" : "Manual"}
            </Text>
          </Pressable>
        </View>

        <Text style={StyleSheet.flatten([styles.label, { color: textColor }])}>Descanso (segundos)</Text>
        <View style={styles.row}>
          <TextInput
            style={StyleSheet.flatten([
              styles.input,
              styles.inputFlex,
              { borderColor, backgroundColor: inputBackground, color: textColor },
            ])}
            value={rest}
            onChangeText={setRest}
            keyboardType="number-pad"
          />
          <Pressable
            style={StyleSheet.flatten([
              styles.toggleButton,
              {
                backgroundColor: restAutoAdvance ? primaryBackground : inputBackground,
                borderColor: restAutoAdvance ? primaryBackground : borderColor,
              },
            ])}
            onPress={() => setRestAutoAdvance((current) => !current)}>
            <Text
              style={StyleSheet.flatten([
                styles.toggleButtonText,
                { color: restAutoAdvance ? primaryText : secondaryText },
              ])}>
              {restAutoAdvance ? "Auto" : "Manual"}
            </Text>
          </Pressable>
        </View>

        <Pressable style={StyleSheet.flatten([styles.button, { backgroundColor: primaryBackground }])} onPress={onCreate}>
          <Text style={StyleSheet.flatten([styles.buttonText, { color: primaryText }])}>Crear</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flex: 1,
    padding: 16,
    gap: 10,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "500" },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12 },
  inputFlex: { flex: 1 },
  toggleButton: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  toggleButtonText: { fontWeight: "600" },
  button: { marginTop: 12, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: "#111" },
  buttonText: { color: "white", fontWeight: "600" },
});
