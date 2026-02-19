import { useColorScheme as useSystemColorScheme } from "react-native";

import { useAppThemeOptional } from "./use-app-theme";

export function useColorScheme() {
  const appTheme = useAppThemeOptional();
  const systemScheme = useSystemColorScheme() ?? "light";
  return appTheme?.colorScheme ?? systemScheme;
}
