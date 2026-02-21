import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useAppTheme, type ThemePreference } from "@/hooks/use-app-theme";
import { useThemeColor } from "@/hooks/use-theme-color";

const OPTIONS: { value: ThemePreference; title: string; description: string }[] = [
  { value: "system", title: "Sistema", description: "Usa el tema del dispositivo" },
  { value: "light", title: "Claro", description: "Siempre claro" },
  { value: "dark", title: "Oscuro", description: "Siempre oscuro" },
];

const VIBRATION_OPTIONS: { value: boolean; title: string; description: string }[] = [
  { value: true, title: "Activada", description: "Usa vibracion en cambios" },
  { value: false, title: "Desactivada", description: "Sin vibracion" },
];

const SOUND_LEVELS: { value: number; title: string; description: string }[] = [
  { value: 0, title: "Silencio", description: "Sin sonido" },
  { value: 0.3, title: "Bajo", description: "Suave" },
  { value: 0.6, title: "Medio", description: "Balanceado" },
  { value: 1, title: "Alto", description: "Maximo" },
];

export default function SettingsScreen() {
  const { preference, setPreference } = useAppTheme();
  const { hapticsEnabled, setHapticsEnabled, soundVolume, setSoundVolume } = useAppSettings();
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

        <Text style={StyleSheet.flatten([styles.sectionTitle, { color: textColor }])}>Sonido y vibracion</Text>
        <Text style={StyleSheet.flatten([styles.subTitle, { color: mutedTextColor }])}>Vibracion</Text>

        <View style={styles.options}>
          {VIBRATION_OPTIONS.map((option) => {
            const selected = option.value === hapticsEnabled;
            return (
              <Pressable
                key={String(option.value)}
                style={StyleSheet.flatten([
                  styles.option,
                  {
                    borderColor,
                    backgroundColor: selected ? selectedBackground : cardBackground,
                  },
                ])}
                onPress={() => setHapticsEnabled(option.value)}>
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

        <Text style={StyleSheet.flatten([styles.subTitle, { color: mutedTextColor }])}>Sonido</Text>

        <View style={styles.options}>
          {SOUND_LEVELS.map((level) => {
            const selected = Math.abs(soundVolume - level.value) < 0.05;
            return (
              <Pressable
                key={level.value}
                style={StyleSheet.flatten([
                  styles.option,
                  {
                    borderColor,
                    backgroundColor: selected ? selectedBackground : cardBackground,
                  },
                ])}
                onPress={() => setSoundVolume(level.value)}>
                <View style={styles.optionText}>
                  <Text style={StyleSheet.flatten([styles.optionTitle, { color: textColor }])}>{level.title}</Text>
                  <Text style={StyleSheet.flatten([styles.optionDescription, { color: mutedTextColor }])}>
                    {level.description}
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
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  subTitle: { fontSize: 13, fontWeight: "600" },
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
