import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

import { useAppThemeOptional } from "./use-app-theme";

export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const appTheme = useAppThemeOptional();
  const colorScheme = useRNColorScheme() ?? "light";

  if (appTheme) return appTheme.colorScheme;
  if (hasHydrated) return colorScheme;

  return "light";
}
