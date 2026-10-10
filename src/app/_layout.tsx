import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MealHistoryProvider } from '@/context/meal-history-context';
import { SettingsProvider } from '@/context/settings-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SettingsProvider>
        <MealHistoryProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="meal/[id]" options={{ title: 'Meal', headerBackTitle: 'Week' }} />
            <Stack.Screen name="gemini-key" options={{ title: 'Get a free Gemini key', presentation: 'modal' }} />
          </Stack>
          <AnimatedSplashOverlay />
        </MealHistoryProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
