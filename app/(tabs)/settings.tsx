import { View, Text, Pressable, StyleSheet } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAppTheme, type ThemePreference } from "@/hooks/use-app-theme";

const OPTIONS: { value: ThemePreference; title: string; description: string }[] = [
  { value: "system", title: "Sistema", description: "Usa el tema del dispositivo" },
  { value: "light", title: "Claro", description: "Siempre claro" },
  { value: "dark", title: "Oscuro", description: "Siempre oscuro" },
];

export default function SettingsScreen() {
  const { preference, setPreference } = useAppTheme();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const mutedTextColor = useThemeColor({ light: "#555", dark: "#9ba1a6" }, "text");
  const borderColor = useThemeColor({ light: "#e0e0e0", dark: "#2a2b2d" }, "text");
  const cardBackground = useThemeColor({ light: "white", dark: "#1c1d1f" }, "background");
  const selectedBackground = useThemeColor({ light: "#f3f4f6", dark: "#232527" }, "background");
  const tintColor = useThemeColor({}, "tint");

  return (
    <View style={StyleSheet.flatten([styles.screen, { backgroundColor }])}>
      <View style={styles.container}>
        <Text style={StyleSheet.flatten([styles.title, { color: textColor }])}>Ajustes</Text>
        <Text style={StyleSheet.flatten([styles.sectionTitle, { color: textColor }])}>Tema</Text>

        <View style={styles.options}>
          {OPTIONS.map((option) => {
            const selected = option.value === preference;
            return (
            <Pressable
              key={option.value}
              style={StyleSheet.flatten([
                styles.option,
                {
                  borderColor,
                  backgroundColor: selected ? selectedBackground : cardBackground,
                },
              ])}
              onPress={() => setPreference(option.value)}>
              <View style={styles.optionText}>
                <Text style={StyleSheet.flatten([styles.optionTitle, { color: textColor }])}>{option.title}</Text>
                <Text style={StyleSheet.flatten([styles.optionDescription, { color: mutedTextColor }])}>
                  {option.description}
                </Text>
              </View>
              <View
                style={StyleSheet.flatten([
                  styles.radio,
                  {
                    borderColor: selected ? tintColor : borderColor,
                    backgroundColor: selected ? tintColor : "transparent",
                  },
                ])}
              />
            </Pressable>
          );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, padding: 16, gap: 12, width: "100%", maxWidth: 520, alignSelf: "center" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  options: { gap: 12 },
  option: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  optionText: { flex: 1, gap: 4 },
  optionTitle: { fontSize: 15, fontWeight: "600" },
  optionDescription: { fontSize: 13 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
});
