import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { deleteMealPhoto } from '@/lib/image';
import { loadMealHistory, saveMealHistory, type MealEntry } from '@/lib/storage/meal-history';

type MealHistoryContextValue = {
  meals: MealEntry[];
  isLoaded: boolean;
  addMeal: (meal: MealEntry) => void;
  removeMeal: (id: string) => void;
};

const MealHistoryContext = createContext<MealHistoryContextValue | null>(null);

export function MealHistoryProvider({ children }: { children: ReactNode }) {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadMealHistory().then((loaded) => {
      if (cancelled) return;
      setMeals(loaded);
      setIsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateMeals = (update: (previous: MealEntry[]) => MealEntry[]) => {
    setMeals((previous) => {
      const next = update(previous);
      void saveMealHistory(next);
      return next;
    });
  };

  const value: MealHistoryContextValue = {
    meals,
    isLoaded,
    addMeal: (meal) => updateMeals((previous) => [meal, ...previous]),
    removeMeal: (id) => {
      const meal = meals.find((entry) => entry.id === id);
      if (meal) deleteMealPhoto(meal.photoUri);
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
