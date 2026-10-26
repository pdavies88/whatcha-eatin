import { StyleSheet, View } from 'react-native';

import { formatGrams, MacroSummary } from '@/components/macro-summary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DisplayFont, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NutritionAnalysis } from '@/lib/nutrition/schema';

const CONFIDENCE_LABEL = { low: 'Low confidence', medium: 'Medium confidence', high: 'High confidence' };

export function NutritionDetails({ analysis }: { analysis: NutritionAnalysis }) {
  const theme = useTheme();

  if (!analysis.is_food) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold" accessibilityRole="header">
          No food detected
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {analysis.notes || 'Try another photo with the food clearly in frame.'}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.mealName} accessibilityRole="header">
          {analysis.meal_name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {CONFIDENCE_LABEL[analysis.confidence]}
        </ThemedText>
      </View>

      <MacroSummary macros={analysis.totals} />

      <ThemedView type="backgroundElement" style={styles.card}>
        {analysis.items.map((item, index) => (
          <View
            key={`${item.name}-${index}`}
            style={[styles.item, index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <View style={styles.itemHeader}>
              <ThemedText type="smallBold" style={styles.itemName}>
                {item.name}
              </ThemedText>
              <ThemedText type="smallBold">{Math.round(item.calories)} kcal</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {item.portion} · P {formatGrams(item.protein_g)} · C {formatGrams(item.carbs_g)} · F{' '}
              {formatGrams(item.fat_g)}
            </ThemedText>
          </View>
        ))}
      </ThemedView>

      {analysis.notes ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.notes}>
          {analysis.notes}
        </ThemedText>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={styles.notes}>
        AI estimates can be off by 20% or more. Use them as a guide, not medical advice.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.half,
  },
  mealName: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    fontFamily: DisplayFont.semiBold,
    fontWeight: 'normal',
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  item: {
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  itemName: {
    flex: 1,
  },
  notes: {
    paddingHorizontal: Spacing.one,
  },
});
