import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { AppState, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';

// 서브디렉토리 직접 참조: barrel export(index.js)를 피해 사용하는 5종만 번들에 포함
const NotoSansKR_400Regular  = require('@expo-google-fonts/noto-sans-kr/400Regular/NotoSansKR_400Regular.ttf');
const NotoSansKR_600SemiBold = require('@expo-google-fonts/noto-sans-kr/600SemiBold/NotoSansKR_600SemiBold.ttf');
const NotoSansKR_700Bold     = require('@expo-google-fonts/noto-sans-kr/700Bold/NotoSansKR_700Bold.ttf');
const NotoSansKR_800ExtraBold= require('@expo-google-fonts/noto-sans-kr/800ExtraBold/NotoSansKR_800ExtraBold.ttf');
const NotoSansKR_900Black    = require('@expo-google-fonts/noto-sans-kr/900Black/NotoSansKR_900Black.ttf');
import * as SplashScreen from 'expo-splash-screen';

import { refreshFortuneWidget } from '@/widgets/scheduleDailyRefresh';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_600SemiBold,
    NotoSansKR_700Bold,
    NotoSansKR_800ExtraBold,
    NotoSansKR_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    refreshFortuneWidget();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshFortuneWidget();
    });
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) return null;

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
