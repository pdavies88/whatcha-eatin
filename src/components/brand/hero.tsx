import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
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
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useTheme } from '@/hooks/use-theme';

const HERO_HEIGHT = 260;
/** In short windows, such as a phone in landscape, the hero gives up space to the form below it. */
const MAX_HERO_SHARE = 0.4;
const GRID = 22;
const SCAN_DURATION = 3_600;

/** A dark panel with a dot grid and a sweeping scan line behind the logo and wordmark. */
export function Hero() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const minHeight = Math.min(HERO_HEIGHT, window.height * MAX_HERO_SHARE) + insets.top;
  // The panel grows when its content needs more room than `minHeight`, so the scan line follows the real height.
  const [height, setHeight] = useState(minHeight);

  return (
    <View style={[styles.hero, { minHeight, backgroundColor: theme.heroBackground }]}>
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="dots" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <Circle cx={GRID / 2} cy={GRID / 2} r={1} fill="#FFFFFF" opacity={0.14} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#dots)" />
        </Svg>
        <ScanLine height={height} color={theme.heroAccent} />
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

function ScanLine({ height, color }: { height: number; color: string }) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) {
      // Park the line in the middle of the panel.
      cancelAnimation(progress);
      progress.value = 0.5;
      return;
    }
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
