import { View, Text, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Interval Timer</Text>

      <Link href="/create-preset" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Crear preset</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 18, padding: 16 },
  title: { fontSize: 26, fontWeight: "600" },
  button: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, backgroundColor: "#111" },
  buttonText: { color: "white", fontWeight: "600" },
});
