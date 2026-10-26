import { Link, useFocusEffect } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MacroSummary } from '@/components/macro-summary';
import { MealPhoto } from '@/components/meal-photo';
import { TargetsCard } from '@/components/targets-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useMealHistory } from '@/context/meal-history-context';
import { useTheme } from '@/hooks/use-theme';
import { sumMacros } from '@/lib/nutrition/totals';
import type { MealEntry } from '@/lib/storage/meal-history';
import { dayKey, RETENTION_DAYS, trackedDays } from '@/lib/week';

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const dayLabelFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

export default function WeekScreen() {
  const { meals, isLoaded } = useMealHistory();
  // "Now" is captured in state and refreshed whenever the tab gains focus, so the week rolls over at midnight.
  const [now, setNow] = useState(Date.now);
  useFocusEffect(() => {
    setNow(Date.now());
  });

  const days = trackedDays(now);
  const todayKey = dayKey(now);
  // Null means "today", so the selection moves to the new day at midnight instead of staying on yesterday.
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // If the selected day has rolled out of the window, fall back to today.
  const activeKey =
    selectedKey && days.some((day) => dayKey(day) === selectedKey) ? selectedKey : todayKey;

  const mealsByDay = new Map<string, MealEntry[]>();
  for (const meal of meals) {
    const key = dayKey(meal.createdAt);
    mealsByDay.set(key, [...(mealsByDay.get(key) ?? []), meal]);
  }
  const caloriesByDay = days.map((day) =>
    sumMacros((mealsByDay.get(dayKey(day)) ?? []).map((meal) => meal.analysis.totals)).calories,
  );
  const maxCalories = Math.max(...caloriesByDay, 1);
  const loggedDays = caloriesByDay.filter((calories) => calories > 0);
  const averageCalories = loggedDays.length
    ? Math.round(loggedDays.reduce((sum, calories) => sum + calories, 0) / loggedDays.length)
    : 0;

  const selectedMeals = [...(mealsByDay.get(activeKey) ?? [])].sort((a, b) => a.createdAt - b.createdAt);
  const selectedDate = days.find((day) => dayKey(day) === activeKey) ?? new Date(now);
  const selectedLabel = activeKey === todayKey ? 'Today' : dayLabelFormatter.format(selectedDate);
  const selectedTotals = sumMacros(selectedMeals.map((meal) => meal.analysis.totals));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText type="subtitle" accessibilityRole="header">
              Week
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Meals stay on this phone for {RETENTION_DAYS} days, then they are cleared automatically.
            </ThemedText>
          </View>

          <TargetsCard dayCalories={selectedTotals.calories} dayLabel={selectedLabel} />

          <View style={styles.strip} accessibilityRole="tablist">
            {days.map((day, index) => {
              const key = dayKey(day);
              return (
                <DayCell
                  key={key}
                  date={day}
                  calories={caloriesByDay[index]}
                  fill={caloriesByDay[index] / maxCalories}
                  isToday={key === todayKey}
                  isSelected={key === activeKey}
                  onPress={() => setSelectedKey(key === todayKey ? null : key)}
                />
              );
            })}
          </View>

          {averageCalories > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Average on logged days: {averageCalories} kcal
            </ThemedText>
          ) : null}

          <MacroSummary
            macros={selectedTotals}
            label={selectedLabel}
          />

          {selectedMeals.map((meal) => (
            <MealRow key={meal.id} meal={meal} />
          ))}
          {isLoaded && selectedMeals.length === 0 ? (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              No meals logged {activeKey === todayKey ? 'yet today' : 'on this day'}.
            </ThemedText>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function DayCell({
  date,
  calories,
  fill,
  isToday,
  isSelected,
  onPress,
}: {
  date: Date;
  calories: number;
  fill: number;
  isToday: boolean;
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const weekday = weekdayFormatter.format(date);

  return (
    <Pressable
      style={styles.dayPressable}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${dayLabelFormatter.format(date)}, ${Math.round(calories)} calories`}>
      <View
        style={[
          styles.day,
          {
            backgroundColor: isSelected ? theme.tint : theme.backgroundElement,
          },
        ]}>
        <ThemedText type="small" style={{ color: isSelected ? theme.onTint : theme.textSecondary }}>
          {isToday ? 'Today' : weekday}
        </ThemedText>
        <ThemedText type="smallBold" style={{ color: isSelected ? theme.onTint : theme.text }}>
          {date.getDate()}
        </ThemedText>
        <View style={[styles.barTrack, { backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : theme.backgroundSelected }]}>
          <View
            style={[
              styles.barFill,
              { height: `${Math.round(fill * 100)}%`, backgroundColor: isSelected ? theme.onTint : theme.tint },
            ]}
          />
        </View>
        <ThemedText style={[styles.dayCalories, { color: isSelected ? theme.onTint : theme.textSecondary }]}>
          {calories > 0 ? Math.round(calories) : '–'}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function MealRow({ meal }: { meal: MealEntry }) {
  const { totals } = meal.analysis;
  return (
    <Link href={{ pathname: '/meal/[id]', params: { id: meal.id } }} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${meal.analysis.meal_name}, ${timeFormatter.format(meal.createdAt)}, ${Math.round(totals.calories)} calories, ${Math.round(totals.protein_g)} grams protein, ${Math.round(totals.carbs_g)} grams carbs, ${Math.round(totals.fat_g)} grams fat`}>
        {({ pressed }) => (
          <ThemedView type="backgroundElement" style={[styles.row, pressed && styles.pressed]}>
            <MealPhoto meal={meal} style={styles.thumbnail} />
            <View style={styles.rowText}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {meal.analysis.meal_name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {timeFormatter.format(meal.createdAt)} · P {Math.round(totals.protein_g)}g · C{' '}
                {Math.round(totals.carbs_g)}g · F {Math.round(totals.fat_g)}g
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
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.one,
  },
  strip: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  dayPressable: {
    flex: 1,
  },
  day: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: 12,
  },
  barTrack: {
    width: 8,
    height: 44,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  dayCalories: {
    fontSize: 11,
    lineHeight: 14,
    fontVariant: ['tabular-nums'],
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: 12,
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
