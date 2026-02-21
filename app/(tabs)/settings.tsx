import { useAppSettings } from "@/hooks/use-app-settings";
import { useAppTheme, type ThemePreference } from "@/hooks/use-app-theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import Slider from "@react-native-community/slider";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

const OPTIONS: { value: ThemePreference; title: string; description: string }[] = [
 { value: "system", title: "Sistema", description: "Usa el tema del dispositivo" },
 { value: "light", title: "Claro", description: "Siempre claro" },
 { value: "dark", title: "Oscuro", description: "Siempre oscuro" },
];

const SOUND_LEVELS: { value: number; title: string }[] = [
 { value: 0, title: "Silencio" },
 { value: 0.3, title: "Bajo" },
 { value: 0.6, title: "Medio" },
 { value: 1, title: "Alto" },
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
 const sliderTrack = useThemeColor({ light: "#d8dadd", dark: "#3a3c3f" }, "text");
 const switchTrackOff = useThemeColor({ light: "#d0d3d6", dark: "#3a3c3f" }, "text");
 const switchThumb = useThemeColor({ light: "#ffffff", dark: "#ffffff" }, "text");
 const rawSoundIndex = SOUND_LEVELS.findIndex((level) => Math.abs(soundVolume - level.value) < 0.05);
 const activeSoundIndex = rawSoundIndex >= 0 ? rawSoundIndex : 2;
 const soundLabel = SOUND_LEVELS[activeSoundIndex]?.title ?? "Medio";

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
        onPress={() => setPreference(option.value)}
       >
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
     <View
      style={StyleSheet.flatten([
       styles.option,
       {
        borderColor,
        backgroundColor: hapticsEnabled ? selectedBackground : cardBackground,
       },
      ])}
     >
      <View style={styles.optionText}>
       <Text style={StyleSheet.flatten([styles.optionTitle, { color: textColor }])}>Activar vibracion</Text>
       <Text style={StyleSheet.flatten([styles.optionDescription, { color: mutedTextColor }])}>
        Vibra al finalizar un set
       </Text>
      </View>
      <Switch
       value={hapticsEnabled}
       onValueChange={setHapticsEnabled}
       trackColor={{ false: switchTrackOff, true: tintColor }}
       thumbColor={switchThumb}
      />
     </View>
    </View>

    <Text style={StyleSheet.flatten([styles.subTitle, { color: mutedTextColor }])}>Sonido</Text>
    <View style={StyleSheet.flatten([styles.sliderCard, { borderColor, backgroundColor: cardBackground }])}>
     <View style={styles.sliderHeader}>
      <Text style={StyleSheet.flatten([styles.sliderTitle, { color: textColor }])}>Nivel</Text>
      <Text style={StyleSheet.flatten([styles.sliderValue, { color: mutedTextColor }])}>{soundLabel}</Text>
     </View>
     <Slider
      minimumValue={0}
      maximumValue={SOUND_LEVELS.length - 1}
      step={1}
      value={activeSoundIndex}
      onValueChange={(value) => {
       const index = Math.max(0, Math.min(SOUND_LEVELS.length - 1, Math.round(value)));
       setSoundVolume(SOUND_LEVELS[index].value);
      }}
      minimumTrackTintColor={tintColor}
      maximumTrackTintColor={sliderTrack}
      thumbTintColor={tintColor}
     />
     <View style={styles.sliderLabels}>
      {SOUND_LEVELS.map((level) => (
       <Text key={level.value} style={StyleSheet.flatten([styles.sliderLabel, { color: mutedTextColor }])}>
        {level.title}
       </Text>
      ))}
     </View>
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
 sliderCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 },
 sliderHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
 sliderTitle: { fontSize: 14, fontWeight: "600" },
 sliderValue: { fontSize: 13, fontWeight: "600" },
 sliderLabels: { flexDirection: "row", justifyContent: "space-between" },
 sliderLabel: { fontSize: 11 },
});
