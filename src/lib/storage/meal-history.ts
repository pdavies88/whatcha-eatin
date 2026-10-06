import Storage from 'expo-sqlite/kv-store';
import { z } from 'zod';

import { NutritionAnalysisSchema } from '@/lib/nutrition/schema';

const HISTORY_KEY = 'mealHistory.v1';

export const MealEntrySchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  photoUri: z.string(),
  providerName: z.string(),
  model: z.string(),
  analysis: NutritionAnalysisSchema,
});

export type MealEntry = z.infer<typeof MealEntrySchema>;

export async function loadMealHistory(): Promise<MealEntry[]> {
  const raw = await Storage.getItemAsync(HISTORY_KEY);
  if (!raw) return [];
  const parsed = z.array(MealEntrySchema).safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : [];
}

export function saveMealHistory(entries: MealEntry[]): Promise<void> {
  return Storage.setItemAsync(HISTORY_KEY, JSON.stringify(entries));
}
