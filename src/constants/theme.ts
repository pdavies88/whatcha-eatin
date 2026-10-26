/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0A0A0A',
    background: '#F5F5F2',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7E7E3',
    textSecondary: '#5C5C58',
    // Darker than the brand orange so text and white labels on it reach WCAG AA (4.5:1).
    tint: '#C44016',
    onTint: '#FFFFFF',
    danger: '#D92D20',
    border: '#DEDED9',
    // Text fields need a 3:1 outline against both background colors (WCAG 1.4.11).
    inputBorder: '#8A8A85',
    protein: '#2F6BFF',
    carbs: '#E8A100',
    fat: '#E0287A',
    heroBackground: '#0B0B0B',
    // The hero is dark in both modes, so it keeps the bright brand orange.
    heroAccent: '#E8501A',
  },
  dark: {
    text: '#F5F5F2',
    background: '#0B0B0B',
    backgroundElement: '#161616',
    backgroundSelected: '#262626',
    textSecondary: '#9A9A95',
    tint: '#FF6A2B',
    onTint: '#0B0B0B',
    danger: '#FF5A4E',
    border: '#2A2A2A',
    inputBorder: '#6B6B66',
    protein: '#5B8CFF',
    carbs: '#FFC233',
    fat: '#FF4F9A',
    heroBackground: '#0B0B0B',
    heroAccent: '#FF6A2B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/**
 * Space Grotesk gives headings, numbers and buttons a sharp, technical look. Body text stays in
 * the system font for legibility. Each weight is its own family, so don't combine these with fontWeight.
 */
export const DisplayFont = {
  medium: 'SpaceGrotesk_500Medium',
  semiBold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
