import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { mealPhotoUri } from '@/lib/image';
import type { MealEntry } from '@/lib/storage/meal-history';

/** A meal's saved photo, or a barcode placeholder for scanned products that came without one. */
export function MealPhoto({
  meal,
  style,
  iconSize = 28,
}: {
  meal: Pick<MealEntry, 'photoFile' | 'analysis'>;
  style: StyleProp<ViewStyle>;
  iconSize?: number;
}) {
  const theme = useTheme();

  if (meal.photoFile) {
    return (
      <View style={[style, styles.clip]}>
        <Image
          source={{ uri: mealPhotoUri(meal.photoFile) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessibilityLabel={`Photo of ${meal.analysis.meal_name}`}
        />
      </View>
    );
  }

  return (
    <View style={[style, styles.placeholder, { backgroundColor: theme.backgroundSelected }]}>
      <SymbolView name="barcode" size={iconSize} tintColor={theme.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
