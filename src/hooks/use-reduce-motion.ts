import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

/**
 * Whether the system "Reduce Motion" setting is on. Reanimated's `useReducedMotion` only reads the
 * setting at launch, so this also follows changes made while the app is open.
 */
export function useReduceMotion() {
  const atLaunch = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(atLaunch);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  return reduceMotion;
}
