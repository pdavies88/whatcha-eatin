import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DisplayFont, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Macros } from '@/lib/nutrition/schema';

const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

type MacroKey = keyof typeof KCAL_PER_GRAM;

export function MacroSummary({ macros, label = 'Total' }: { macros: Macros; label?: string }) {
  const theme = useTheme();
  const grams: Record<MacroKey, number> = {
    protein: macros.protein_g,
    carbs: macros.carbs_g,
    fat: macros.fat_g,
  };
  const macroCalories = (Object.keys(grams) as MacroKey[]).reduce(
    (sum, key) => sum + grams[key] * KCAL_PER_GRAM[key],
    0,
  );

  const rows: { key: MacroKey; title: string; color: string }[] = [
    { key: 'protein', title: 'Protein', color: theme.protein },
    { key: 'carbs', title: 'Carbs', color: theme.carbs },
    { key: 'fat', title: 'Fat', color: theme.fat },
  ];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.caloriesRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText style={styles.calories} accessibilityLabel={`${Math.round(macros.calories)} calories`}>
          {Math.round(macros.calories)}
          <ThemedText themeColor="textSecondary"> kcal</ThemedText>
        </ThemedText>
      </View>

      <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {rows.map((row) => (
          <View
            key={row.key}
            style={{
              flex: macroCalories > 0 ? (grams[row.key] * KCAL_PER_GRAM[row.key]) / macroCalories : 1 / 3,
              backgroundColor: row.color,
            }}
          />
        ))}
      </View>

      <View style={styles.macroRow}>
        {rows.map((row) => (
          <View key={row.key} style={styles.macro}>
            <View style={[styles.dot, { backgroundColor: row.color }]} />
            <ThemedText type="smallBold">{formatGrams(grams[row.key])}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {row.title}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.secondaryRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Fiber {formatGrams(macros.fiber_g)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Sugar {formatGrams(macros.sugar_g)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

export function formatGrams(value: number): string {
  return `${Math.round(value * 10) / 10}g`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  caloriesRow: {
    gap: Spacing.one,
  },
  calories: {
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -1.5,
    fontFamily: DisplayFont.semiBold,
    fontWeight: 'normal',
    fontVariant: ['tabular-nums'],
  },
  bar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 2,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
});
