import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  // Raised surfaces get a hairline edge, which keeps cards crisp against the flat background.
  const edge = type === 'backgroundElement' ? { borderWidth: 1, borderColor: theme.border } : null;

  return <View style={[{ backgroundColor: theme[type ?? 'background'] }, edge, style]} {...otherProps} />;
}
