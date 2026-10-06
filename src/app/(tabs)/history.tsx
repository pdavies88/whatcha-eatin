import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MacroSummary } from '@/components/macro-summary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useMealHistory } from '@/context/meal-history-context';
import { isSameDay, sumMacros } from '@/lib/nutrition/totals';
import type { MealEntry } from '@/lib/storage/meal-history';

const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export default function HistoryScreen() {
  const { meals, isLoaded } = useMealHistory();
  // "Now" is captured in state and refreshed whenever the tab gains focus, so "Today" rolls over at midnight.
  const [now, setNow] = useState(Date.now);
  useFocusEffect(() => {
    setNow(Date.now());
  });
  const todayTotals = sumMacros(
    meals.filter((meal) => isSameDay(meal.createdAt, now)).map((meal) => meal.analysis.totals),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <FlatList
          data={meals}
          keyExtractor={(meal) => meal.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="subtitle">History</ThemedText>
              <MacroSummary macros={todayTotals} label="Today" />
            </View>
          }
          ListEmptyComponent={
            isLoaded ? (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                Meals you save will appear here.
              </ThemedText>
            ) : null
          }
          renderItem={({ item }) => <MealRow meal={item} now={now} />}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function MealRow({ meal, now }: { meal: MealEntry; now: number }) {
  const when = isSameDay(meal.createdAt, now)
    ? timeFormatter.format(meal.createdAt)
    : `${dateFormatter.format(meal.createdAt)}, ${timeFormatter.format(meal.createdAt)}`;
  const { totals } = meal.analysis;

  return (
    <Link href={{ pathname: '/meal/[id]', params: { id: meal.id } }} asChild>
      <Pressable accessibilityRole="button">
        {({ pressed }) => (
          <ThemedView type="backgroundElement" style={[styles.row, pressed && styles.pressed]}>
            <Image source={{ uri: meal.photoUri }} style={styles.thumbnail} contentFit="cover" />
            <View style={styles.rowText}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {meal.analysis.meal_name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {when} · P {Math.round(totals.protein_g)}g · C {Math.round(totals.carbs_g)}g · F{' '}
                {Math.round(totals.fat_g)}g
              </ThemedText>
            </View>
            <ThemedText type="smallBold">{Math.round(totals.calories)}</ThemedText>
          </ThemedView>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: Spacing.two,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
});
