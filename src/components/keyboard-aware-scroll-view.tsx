import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';

/**
 * A ScrollView that keeps the focused text input above the keyboard on both platforms.
 *
 * - iOS: `automaticallyAdjustKeyboardInsets` adds room for the keyboard and scrolls to the input.
 * - Android: with edge-to-edge (on by default in this SDK) the window no longer shrinks for the
 *   keyboard, so a KeyboardAvoidingView pads the bottom instead. Android's ScrollView then keeps the
 *   focused input in view as its height shrinks.
 */
export function KeyboardAwareScrollView({ children, ...props }: ScrollViewProps) {
  const scrollView = (
    <ScrollView
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      {...props}>
      {children}
    </ScrollView>
  );

  if (Platform.OS !== 'android') return scrollView;

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.fill}>
      {scrollView}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
