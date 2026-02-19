import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { Link, useRouter } from "expo-router";
import { usePresets } from "@/hooks/use-presets";
import type { WorkoutPreset } from "@/domain/models/WorkoutPreset";

export default function PresetsScreen() {
  const router = useRouter();
  const { presets, removePreset } = usePresets();

  function startPreset(preset: WorkoutPreset) {
    router.push({
      pathname: "/timer",
      params: {
        sets: String(preset.sets),
        exerciseSeconds: String(preset.exerciseSeconds),
        restSeconds: String(preset.restSeconds),
      },
    });
  }

  if (presets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.title}>Presets</Text>
        <Text style={styles.emptyText}>Aun no hay presets guardados.</Text>
        <Link href="/create-preset" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Crear preset</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Presets</Text>
        <Link href="/create-preset" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Nuevo</Text>
          </Pressable>
        </Link>
      </View>

      <FlatList
        data={presets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>
              {item.exerciseSeconds}s ejercicio - {item.restSeconds}s descanso - {item.sets} sets
            </Text>
            <View style={styles.cardActions}>
              <Pressable style={styles.primaryButton} onPress={() => startPreset(item)}>
                <Text style={styles.primaryButtonText}>Iniciar</Text>
              </Pressable>
              <Pressable style={styles.dangerButton} onPress={() => removePreset(item.id)}>
                <Text style={styles.dangerButtonText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  header: {
    padding: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 22, fontWeight: "600" },
  listContent: { padding: 16, paddingTop: 8, gap: 12 },
  card: { borderWidth: 1, borderColor: "#e6e6e6", borderRadius: 14, padding: 14, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardMeta: { fontSize: 13, color: "#555" },
  cardActions: { flexDirection: "row", gap: 10 },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "#111" },
  primaryButtonText: { color: "white", fontWeight: "600" },
  secondaryButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#111" },
  secondaryButtonText: { color: "#111", fontWeight: "600" },
  dangerButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: "#c0392b" },
  dangerButtonText: { color: "#c0392b", fontWeight: "600" },
  emptyContainer: { flex: 1, padding: 16, gap: 12, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center" },
});
