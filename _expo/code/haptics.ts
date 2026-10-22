import * as Haptics from 'expo-haptics';

import { hasNativeModules } from '@/lib/environment';

export const haptics = {
  light: () => {
    if (!hasNativeModules) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium: () => {
    if (!hasNativeModules) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  heavy: () => {
    if (!hasNativeModules) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  selection: () => {
    if (!hasNativeModules) return;
    void Haptics.selectionAsync();
  },
  success: () => {
    if (!hasNativeModules) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning: () => {
    if (!hasNativeModules) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error: () => {
    if (!hasNativeModules) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
