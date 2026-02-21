import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppSettingsProvider } from '@/hooks/use-app-settings';
import { AppThemeProvider, useAppTheme } from '@/hooks/use-app-theme';
import { PresetsProvider } from '@/hooks/use-presets';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AppSettingsProvider>
        <RootLayoutContent />
      </AppSettingsProvider>
    </AppThemeProvider>
  );
}

function RootLayoutContent() {
  const { colorScheme } = useAppTheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PresetsProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </PresetsProvider>
    </ThemeProvider>
  );
}
