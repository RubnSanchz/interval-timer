import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import notifee from '@notifee/react-native';

import { AppSettingsProvider } from '@/hooks/use-app-settings';
import { AppThemeProvider, useAppTheme } from '@/hooks/use-app-theme';
import { PresetsProvider } from '@/hooks/use-presets';
import { ensureTimerNotificationsReady } from '@/services/timer-notifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AppSettingsProvider>
        <SafeAreaProvider>
          <RootLayoutContent />
        </SafeAreaProvider>
      </AppSettingsProvider>
    </AppThemeProvider>
  );
}

function RootLayoutContent() {
  const { colorScheme } = useAppTheme();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let isActive = true;
    ensureTimerNotificationsReady()
      .then((enabled) => {
        if (!isActive || enabled) return;
        Alert.alert(
          'Notificaciones necesarias',
          'Permite notificaciones para que el timer funcione en segundo plano.',
          [
            {
              text: 'Abrir ajustes',
              onPress: () => {
                notifee.openNotificationSettings().catch(() => {});
              },
            },
            { text: 'Cancelar', style: 'cancel' },
          ]
        );
      })
      .catch(() => {});
    return () => {
      isActive = false;
    };
  }, []);

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
