import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * iOS number pads have no Return key, so there's no way to close them. Render one of these per
 * TextInput with a unique `id`, and give the TextInput `inputAccessoryViewID={id}`, to add a
 * "Done" bar above its keyboard. A single bar shared by several inputs only attaches to one of them.
 */
export function KeyboardDoneBar({ id }: { id: string }) {
  const theme = useTheme();
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={id}>
      <View style={[styles.bar, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}>
        <Pressable accessibilityRole="button" onPress={Keyboard.dismiss} hitSlop={8}>
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            Done
          </ThemedText>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
