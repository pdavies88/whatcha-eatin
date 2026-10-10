import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { deleteMealPhoto, deleteOrphanedMealPhotos } from '@/lib/image';
import { loadMealHistory, saveMealHistory, type MealEntry } from '@/lib/storage/meal-history';
import { partitionByRetention } from '@/lib/week';

type MealHistoryContextValue = {
  meals: MealEntry[];
  isLoaded: boolean;
  addMeal: (meal: MealEntry) => void;
  removeMeal: (id: string) => void;
};

const MealHistoryContext = createContext<MealHistoryContextValue | null>(null);

/**
 * Drops meals outside the 7-day window and deletes their photos. It runs inside state updaters,
 * which React may call twice in development; photo deletion is idempotent, so that is safe.
 */
function pruneExpired(meals: MealEntry[]): MealEntry[] {
  const { kept, expired } = partitionByRetention(meals, Date.now());
  for (const meal of expired) deleteMealPhoto(meal.photoFile);
  return expired.length > 0 ? kept : meals;
}

export function MealHistoryProvider({ children }: { children: ReactNode }) {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const updateMeals = (update: (previous: MealEntry[]) => MealEntry[]) => {
    setMeals((previous) => {
      const next = update(previous);
      if (next !== previous) void saveMealHistory(next);
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    loadMealHistory().then((loaded) => {
      if (cancelled) return;
      const kept = pruneExpired(loaded);
      if (kept !== loaded) void saveMealHistory(kept);
      deleteOrphanedMealPhotos(new Set(kept.map((meal) => meal.photoFile)));
      setMeals(kept);
      setIsLoaded(true);
    });

    // The app can stay in memory across midnight, so prune again whenever it returns to the foreground.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') updateMeals(pruneExpired);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  const value: MealHistoryContextValue = {
    meals,
    isLoaded,
    addMeal: (meal) => updateMeals((previous) => pruneExpired([meal, ...previous])),
    removeMeal: (id) => {
      const meal = meals.find((entry) => entry.id === id);
      if (meal) deleteMealPhoto(meal.photoFile);
      updateMeals((previous) => previous.filter((entry) => entry.id !== id));
    },
  };

  return <MealHistoryContext value={value}>{children}</MealHistoryContext>;
}

export function useMealHistory(): MealHistoryContextValue {
  const context = use(MealHistoryContext);
  if (!context) {
    throw new Error('useMealHistory must be used within a MealHistoryProvider');
  }
  return context;
}
