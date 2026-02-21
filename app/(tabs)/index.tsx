import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { validateTimerConfig } from "@/domain/validators/validateTimerConfig";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function ConfigScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({ light: "#ccc", dark: "#333" }, "text");
  const inputBackground = useThemeColor({ light: "white", dark: "#1c1d1f" }, "background");
  const primaryBackground = useThemeColor({ light: "#111", dark: "#ECEDEE" }, "text");
  const primaryText = useThemeColor({ light: "white", dark: "#111" }, "text");
  const secondaryBorder = useThemeColor({ light: "#111", dark: "#ECEDEE" }, "text");
  const secondaryText = useThemeColor({ light: "#111", dark: "#ECEDEE" }, "text");
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
    <SafeAreaView style={StyleSheet.flatten([styles.screen, { backgroundColor }])} edges={["top"]}>
      <View style={styles.container}>
        <Text style={StyleSheet.flatten([styles.title, { color: textColor }])}>Configurar intervalo</Text>

        <Text style={StyleSheet.flatten([styles.label, { color: textColor }])}>Numero de sets</Text>
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
        <TextInput
          style={StyleSheet.flatten([
            styles.input,
            { borderColor, backgroundColor: inputBackground, color: textColor },
          ])}
          value={exercise}
          onChangeText={setExercise}
          keyboardType="number-pad"
        />

        <Text style={StyleSheet.flatten([styles.label, { color: textColor }])}>Descanso (segundos)</Text>
        <TextInput
          style={StyleSheet.flatten([
            styles.input,
            { borderColor, backgroundColor: inputBackground, color: textColor },
          ])}
          value={rest}
          onChangeText={setRest}
          keyboardType="number-pad"
        />

        <Pressable
          style={StyleSheet.flatten([styles.primaryButton, { backgroundColor: primaryBackground }])}
          onPress={onStart}>
          <Text style={StyleSheet.flatten([styles.primaryButtonText, { color: primaryText }])}>Iniciar</Text>
        </Pressable>

        <Link href="/create-preset" asChild>
          <Pressable style={StyleSheet.flatten([styles.secondaryButton, { borderColor: secondaryBorder }])}>
            <Text style={StyleSheet.flatten([styles.secondaryButtonText, { color: secondaryText }])}>
              Crear preset
            </Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
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
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12 },
  primaryButton: { marginTop: 10, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: "#111" },
  primaryButtonText: { color: "white", fontWeight: "600" },
  secondaryButton: { padding: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#111" },
  secondaryButtonText: { color: "#111", fontWeight: "600" },
});
