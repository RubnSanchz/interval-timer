import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

export type ThemePreference = "system" | "light" | "dark";

type AppThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  colorScheme: "light" | "dark";
};

const AppThemeContext = createContext<AppThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [preference, setPreference] = useState<ThemePreference>("system");
  const colorScheme = preference === "system" ? systemScheme : preference;

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      colorScheme,
    }),
    [preference, systemScheme]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) throw new Error("useAppTheme must be used within AppThemeProvider");
  return context;
}

export function useAppThemeOptional() {
  return useContext(AppThemeContext);
}
