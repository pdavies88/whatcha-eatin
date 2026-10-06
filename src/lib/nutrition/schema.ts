import { z } from 'zod';

/** Coerces numeric strings like "12" or "12.5g" that some models emit despite instructions. */
const nonNegativeNumber = z.preprocess((value) => {
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
}, z.number().nonnegative());

export const MacrosSchema = z.object({
  calories: nonNegativeNumber,
  protein_g: nonNegativeNumber,
  carbs_g: nonNegativeNumber,
  fat_g: nonNegativeNumber,
  fiber_g: nonNegativeNumber,
  sugar_g: nonNegativeNumber,
});

export const FoodItemSchema = MacrosSchema.extend({
  name: z.string().min(1),
  portion: z.string(),
});

export const NutritionAnalysisSchema = z.object({
  is_food: z.boolean(),
  meal_name: z.string(),
  items: z.array(FoodItemSchema),
  totals: MacrosSchema,
  confidence: z.enum(['low', 'medium', 'high']),
  notes: z.string(),
});

export type Macros = z.infer<typeof MacrosSchema>;
export type FoodItem = z.infer<typeof FoodItemSchema>;
export type NutritionAnalysis = z.infer<typeof NutritionAnalysisSchema>;

const macroProperties = {
  calories: { type: 'number', description: 'Kilocalories' },
  protein_g: { type: 'number', description: 'Protein in grams' },
  carbs_g: { type: 'number', description: 'Total carbohydrates in grams' },
  fat_g: { type: 'number', description: 'Total fat in grams' },
  fiber_g: { type: 'number', description: 'Dietary fiber in grams' },
  sugar_g: { type: 'number', description: 'Sugars in grams' },
} as const;

const macroKeys = Object.keys(macroProperties);

/**
 * Hand-written JSON Schema shared by providers that support structured output.
 * Kept to the common subset (no unions, every property required, no extra keys)
 * so it is accepted by OpenAI strict mode, Gemini, and Anthropic alike.
 */
export const NUTRITION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['is_food', 'meal_name', 'items', 'totals', 'confidence', 'notes'],
  properties: {
    is_food: { type: 'boolean', description: 'False if the photo does not contain food' },
    meal_name: { type: 'string', description: 'Short descriptive name for the meal' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'portion', ...macroKeys],
        properties: {
          name: { type: 'string' },
          portion: { type: 'string', description: 'Estimated portion, e.g. "1 cup (150 g)"' },
          ...macroProperties,
        },
      },
    },
    totals: {
      type: 'object',
      additionalProperties: false,
      required: macroKeys,
      properties: macroProperties,
    },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    notes: {
      type: 'string',
      description: 'Assumptions made (hidden oils, sauces, portion size) or caveats',
    },
  },
} as const;
