import { PlatformPressable } from 'expo-router/react-navigation';
import type { BottomTabBarButtonProps } from 'expo-router/tabs';
import * as Haptics from 'expo-haptics';
import { useAppSettingsOptional } from '@/hooks/use-app-settings';

export function HapticTab(props: BottomTabBarButtonProps) {
  const settings = useAppSettingsOptional();
  const hapticsEnabled = settings?.hapticsEnabled ?? true;

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios' && hapticsEnabled) {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
