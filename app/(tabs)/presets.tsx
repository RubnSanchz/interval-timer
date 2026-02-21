import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { usePresets } from "@/hooks/use-presets";
import type { WorkoutPreset } from "@/domain/models/WorkoutPreset";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function PresetsScreen() {
  const router = useRouter();
  const { presets, removePreset } = usePresets();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const mutedTextColor = useThemeColor({ light: "#555", dark: "#9ba1a6" }, "text");
  const borderColor = useThemeColor({ light: "#e6e6e6", dark: "#2a2b2d" }, "text");
  const cardBackground = useThemeColor({ light: "white", dark: "#1c1d1f" }, "background");
  const primaryBackground = useThemeColor({ light: "#111", dark: "#ECEDEE" }, "text");
  const primaryText = useThemeColor({ light: "white", dark: "#111" }, "text");
  const secondaryBorder = useThemeColor({ light: "#111", dark: "#ECEDEE" }, "text");
  const secondaryText = useThemeColor({ light: "#111", dark: "#ECEDEE" }, "text");
  const dangerColor = useThemeColor({ light: "#c0392b", dark: "#ff7b6b" }, "text");

  function startPreset(preset: WorkoutPreset) {
    router.push({
      pathname: "/timer",
      params: {
        sets: String(preset.sets),
        exerciseSeconds: String(preset.exerciseSeconds),
        restSeconds: String(preset.restSeconds),
        exerciseAutoAdvance: preset.exerciseAutoAdvance ? "1" : "0",
        restAutoAdvance: preset.restAutoAdvance ? "1" : "0",
      },
    });
  }

  if (presets.length === 0) {
    return (
      <SafeAreaView style={StyleSheet.flatten([styles.screen, { backgroundColor }])} edges={["top"]}>
        <View style={styles.emptyContainer}>
          <Text style={StyleSheet.flatten([styles.title, { color: textColor }])}>Presets</Text>
          <Text style={StyleSheet.flatten([styles.emptyText, { color: mutedTextColor }])}>
            Aun no hay presets guardados.
          </Text>
          <Link href="/create-preset" asChild>
            <Pressable style={StyleSheet.flatten([styles.primaryButton, { backgroundColor: primaryBackground }])}>
              <Text style={StyleSheet.flatten([styles.primaryButtonText, { color: primaryText }])}>Crear preset</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={StyleSheet.flatten([styles.screen, { backgroundColor }])} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={StyleSheet.flatten([styles.title, { color: textColor }])}>Presets</Text>
          <Link href="/create-preset" asChild>
            <Pressable style={StyleSheet.flatten([styles.secondaryButton, { borderColor: secondaryBorder }])}>
              <Text style={StyleSheet.flatten([styles.secondaryButtonText, { color: secondaryText }])}>Nuevo</Text>
            </Pressable>
          </Link>
        </View>

        <FlatList
          data={presets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={StyleSheet.flatten([styles.card, { borderColor, backgroundColor: cardBackground }])}>
              <Text style={StyleSheet.flatten([styles.cardTitle, { color: textColor }])}>{item.name}</Text>
              <Text style={StyleSheet.flatten([styles.cardMeta, { color: mutedTextColor }])}>
                {item.exerciseSeconds}s ejercicio - {item.restSeconds}s descanso - {item.sets} sets
              </Text>
              <View style={styles.cardActions}>
                <Pressable
                  style={StyleSheet.flatten([styles.primaryButton, { backgroundColor: primaryBackground }])}
                  onPress={() => startPreset(item)}>
                  <Text style={StyleSheet.flatten([styles.primaryButtonText, { color: primaryText }])}>Iniciar</Text>
                </Pressable>
                <Pressable
                  style={StyleSheet.flatten([styles.dangerButton, { borderColor: dangerColor }])}
                  onPress={() => removePreset(item.id)}>
                  <Text style={StyleSheet.flatten([styles.dangerButtonText, { color: dangerColor }])}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  header: {
    padding: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  title: { fontSize: 22, fontWeight: "600" },
  listContent: { padding: 16, paddingTop: 8, gap: 12, width: "100%", maxWidth: 520, alignSelf: "center" },
  card: { borderWidth: 1, borderColor: "#e6e6e6", borderRadius: 14, padding: 14, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardMeta: { fontSize: 13 },
  cardActions: { flexDirection: "row", gap: 10 },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "#111" },
  primaryButtonText: { color: "white", fontWeight: "600" },
  secondaryButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#111" },
  secondaryButtonText: { color: "#111", fontWeight: "600" },
  dangerButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: "#c0392b" },
  dangerButtonText: { color: "#c0392b", fontWeight: "600" },
  emptyContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center" },
});
