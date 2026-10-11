import { Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold, useFonts } from '@expo-google-fonts/fredoka';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { SplashOverlay } from '@/components/brand/splash-overlay';
import { MealHistoryProvider } from '@/context/meal-history-context';
import { ProfileProvider } from '@/context/profile-context';
import { SettingsProvider } from '@/context/settings-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Fonts load at runtime (rather than via the expo-font config plugin) so the app also works in Expo Go.
  const [fontsLoaded, fontError] = useFonts({ Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold });

  // The native splash stays up until the overlay renders, so nothing shows in the fallback font.
  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SettingsProvider>
        <MealHistoryProvider>
          <ProfileProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="meal/[id]" options={{ title: 'Meal', headerBackTitle: 'Week' }} />
              <Stack.Screen name="gemini-key" options={{ title: 'Get a free Gemini key', presentation: 'modal' }} />
              <Stack.Screen name="barcode" options={{ title: 'Scan a barcode', presentation: 'modal' }} />
              <Stack.Screen name="profile" options={{ title: 'Your daily targets', presentation: 'modal' }} />
            </Stack>
            <SplashOverlay />
          </ProfileProvider>
        </MealHistoryProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
