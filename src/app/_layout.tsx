import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { SplashOverlay } from '@/components/brand/splash-overlay';
import { Colors } from '@/constants/theme';
import { MealHistoryProvider } from '@/context/meal-history-context';
import { ProfileProvider } from '@/context/profile-context';
import { SettingsProvider } from '@/context/settings-context';

SplashScreen.preventAutoHideAsync();

/** Headers, modals and the back button pick up the app's palette instead of the platform defaults. */
function navigationTheme(base: Theme, colors: (typeof Colors)['light' | 'dark']): Theme {
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.tint,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };
}

const NAVIGATION_THEMES = {
  light: navigationTheme(DefaultTheme, Colors.light),
  dark: navigationTheme(DarkTheme, Colors.dark),
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Fonts load at runtime (rather than via the expo-font config plugin) so the app also works in Expo Go.
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  // The native splash stays up until the overlay renders, so nothing shows in the fallback font.
  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={NAVIGATION_THEMES[colorScheme === 'dark' ? 'dark' : 'light']}>
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
