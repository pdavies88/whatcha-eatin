import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { LogoMark } from '@/components/brand/logo-mark';
import { ThemedText } from '@/components/themed-text';
import { APP_NAME, APP_TAGLINE } from '@/constants/brand';
import { DisplayFont, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HERO_HEIGHT = 260;
const GRID = 22;
const SCAN_DURATION = 3_600;

/** A dark panel with a dot grid and a sweeping scan line behind the logo and wordmark. */
export function Hero() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const height = HERO_HEIGHT + insets.top;

  return (
    <View style={[styles.hero, { height, backgroundColor: theme.heroBackground }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="dots" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <Circle cx={GRID / 2} cy={GRID / 2} r={1} fill="#FFFFFF" opacity={0.14} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#dots)" />
        </Svg>
        <ScanLine height={height} color={theme.tint} />
      </View>

      <View style={[styles.content, { paddingTop: insets.top }]}>
        <LogoMark size={72} />
        <View style={styles.words}>
          <View style={[styles.rule, { backgroundColor: theme.tint }]} />
          <ThemedText style={styles.wordmark} numberOfLines={1} adjustsFontSizeToFit>
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

function ScanLine({ height, color }: { height: number; color: string }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: SCAN_DURATION, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(progress);
  }, [reduceMotion, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * (height - 2) }],
  }));

  return (
    <Animated.View
      style={[styles.scanLine, { backgroundColor: color, boxShadow: `0 0 18px 4px ${color}66` }, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.55,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.four,
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
