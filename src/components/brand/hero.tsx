import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { LogoMark } from '@/components/brand/logo-mark';
import { ThemedText } from '@/components/themed-text';
import { APP_NAME, APP_TAGLINE } from '@/constants/brand';
import { DisplayFont, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HERO_HEIGHT = 260;
/** In short windows, such as a phone in landscape, the hero gives up space to the form below it. */
const MAX_HERO_SHARE = 0.4;
const GRID = 22;

/** A dark panel with a dot grid behind the logo and wordmark, edged in the brand orange. */
export function Hero() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  // The panel grows past this when its content needs more room.
  const minHeight = Math.min(HERO_HEIGHT, window.height * MAX_HERO_SHARE) + insets.top;

  return (
    <View
      style={[
        styles.hero,
        { minHeight, backgroundColor: theme.heroBackground, borderBottomColor: theme.heroAccent },
      ]}>
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="dots" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <Circle cx={GRID / 2} cy={GRID / 2} r={1} fill="#FFFFFF" opacity={0.14} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#dots)" />
        </Svg>
      </View>

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingLeft: insets.left + Spacing.four,
            paddingRight: insets.right + Spacing.four,
          },
        ]}>
        <LogoMark size={72} />
        <View style={styles.words}>
          <View style={[styles.rule, { backgroundColor: theme.heroAccent }]} />
          <ThemedText
            style={styles.wordmark}
            numberOfLines={1}
            adjustsFontSizeToFit
            accessibilityRole="header"
            accessibilityLabel={APP_NAME}>
            {APP_NAME.toUpperCase()}
          </ThemedText>
          <ThemedText type="small" style={styles.tagline}>
            {APP_TAGLINE}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
    borderBottomWidth: 2,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  words: {
    gap: Spacing.one,
  },
  rule: {
    width: 32,
    height: 4,
    marginBottom: Spacing.one,
  },
  wordmark: {
    color: '#F5F5F2',
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.5,
    fontFamily: DisplayFont.bold,
    fontWeight: 'normal',
  },
  tagline: {
    color: '#9A9A95',
  },
});
