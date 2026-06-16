import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { AppState, useColorScheme } from 'react-native';

import { refreshFortuneWidget } from '@/widgets/scheduleDailyRefresh';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Opportunistic refresh layer (see plan's 3-tier widget refresh
    // strategy) — catches the date having rolled over while the app was
    // backgrounded, without waiting for the next updatePeriodMillis tick.
    refreshFortuneWidget();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshFortuneWidget();
    });
    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </ThemeProvider>
  );
}
