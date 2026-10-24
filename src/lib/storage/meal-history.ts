import Storage from 'expo-sqlite/kv-store';
import { z } from 'zod';

import { NutritionAnalysisSchema } from '@/lib/nutrition/schema';

// v2 stores photo file names instead of absolute paths.
const HISTORY_KEY = 'mealHistory.v2';
const LEGACY_HISTORY_KEY = 'mealHistory.v1';

export const MealEntrySchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  /** File name in the meal-photos folder. Missing for typed meals and for scanned products that have no photo. */
  photoFile: z.string().optional(),
  /** How the meal was logged. Older entries predate barcode scanning, so they default to a photo. */
  source: z.enum(['photo', 'barcode', 'text']).default('photo'),
  /** What the user typed, for meals logged from a description. */
  description: z.string().optional(),
  barcode: z.string().optional(),
  providerName: z.string(),
  model: z.string(),
  analysis: NutritionAnalysisSchema,
});

export type MealEntry = z.infer<typeof MealEntrySchema>;
export type NewMealEntry = z.input<typeof MealEntrySchema>;

export async function loadMealHistory(): Promise<MealEntry[]> {
  // Early test builds used a different format. Those meals are older than the 7-day window anyway.
  void Storage.removeItemAsync(LEGACY_HISTORY_KEY);
  const raw = await Storage.getItemAsync(HISTORY_KEY);
  if (!raw) return [];
  const parsed = z.array(MealEntrySchema).safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : [];
}

export function saveMealHistory(entries: MealEntry[]): Promise<void> {
  return Storage.setItemAsync(HISTORY_KEY, JSON.stringify(entries));
}
