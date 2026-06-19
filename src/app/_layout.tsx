import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { AppState, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { refreshFortuneWidget } from '@/widgets/scheduleDailyRefresh';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    refreshFortuneWidget();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshFortuneWidget();
    });
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="card-demo" />
          <Stack.Screen name="fortune" />
          <Stack.Screen name="gacha" />
          <Stack.Screen name="collection" />
          <Stack.Screen name="coin-shop" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
