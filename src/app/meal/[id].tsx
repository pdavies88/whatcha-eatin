import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { MealPhoto } from '@/components/meal-photo';
import { NutritionDetails } from '@/components/nutrition-details';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DisplayFont, MaxContentWidth, Spacing } from '@/constants/theme';
import { useMealHistory } from '@/context/meal-history-context';
import { useTheme } from '@/hooks/use-theme';
import { OPEN_FOOD_FACTS_CREDIT } from '@/lib/barcode/open-food-facts';

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { meals, removeMeal } = useMealHistory();
  const theme = useTheme();
  const meal = meals.find((entry) => entry.id === id);

  if (!meal) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText themeColor="textSecondary">This meal no longer exists.</ThemedText>
      </ThemedView>
    );
  }

  const confirmDelete = () => {
    Alert.alert('Delete meal?', 'This removes the meal and its photo from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeMeal(meal.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: meal.analysis.meal_name }} />
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {meal.source === 'text' && meal.description ? (
          <View style={[styles.quote, { borderLeftColor: theme.tint }]}>
            <ThemedText themeColor="textSecondary" type="smallBold" accessibilityLabel="You said">
              YOU SAID
            </ThemedText>
            <ThemedText style={styles.quoteText}>{meal.description}</ThemedText>
          </View>
        ) : (
          <MealPhoto meal={meal} style={styles.photo} iconSize={64} />
        )}
        <NutritionDetails analysis={meal.analysis} />
        <ThemedText type="small" themeColor="textSecondary">
          {dateTimeFormatter.format(meal.createdAt)} · {meal.providerName}
          {meal.source === 'barcode' ? ` · barcode ${meal.barcode ?? ''}` : ` · ${meal.model}`}
        </ThemedText>
        {meal.source === 'barcode' ? (
          <ThemedText type="small" themeColor="textSecondary">
            {OPEN_FOOD_FACTS_CREDIT}.
          </ThemedText>
        ) : null}
        <Button title="Delete meal" variant="destructive" onPress={confirmDelete} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
  },
  quote: {
    borderLeftWidth: 4,
    paddingLeft: Spacing.three,
    gap: Spacing.one,
  },
  quoteText: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: DisplayFont.medium,
    fontWeight: 'normal',
  },
});
