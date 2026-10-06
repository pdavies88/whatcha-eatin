import { describe, expect, it } from '@jest/globals';

import { extractJson, NutritionParseError, parseNutritionResponse } from '../parse';

const macros = { calories: 500, protein_g: 30, carbs_g: 40, fat_g: 20, fiber_g: 5, sugar_g: 8 };

const validAnalysis = {
  is_food: true,
  meal_name: 'Chicken bowl',
  items: [{ name: 'Grilled chicken', portion: '150 g', ...macros }],
  totals: macros,
  confidence: 'medium',
  notes: 'Assumed 1 tbsp olive oil.',
};

describe('extractJson', () => {
  it('parses plain JSON', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses JSON inside a markdown fence', () => {
    expect(extractJson('Here you go:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('parses JSON surrounded by prose', () => {
    expect(extractJson('Sure! {"a":{"b":2}} Hope that helps.')).toEqual({ a: { b: 2 } });
  });

  it('throws when there is no JSON', () => {
    expect(() => extractJson('I cannot help with that.')).toThrow(NutritionParseError);
  });
});

describe('parseNutritionResponse', () => {
  it('returns a validated analysis', () => {
    expect(parseNutritionResponse(JSON.stringify(validAnalysis))).toEqual(validAnalysis);
  });

  it('coerces numeric strings', () => {
    const withStrings = { ...validAnalysis, totals: { ...macros, calories: '500', protein_g: '30.5g' } };
    const result = parseNutritionResponse(JSON.stringify(withStrings));
    expect(result.totals.calories).toBe(500);
    expect(result.totals.protein_g).toBe(30.5);
  });

  it('rejects responses missing required fields', () => {
    const { totals: _totals, ...missingTotals } = validAnalysis;
    expect(() => parseNutritionResponse(JSON.stringify(missingTotals))).toThrow(NutritionParseError);
  });

  it('rejects negative values', () => {
    const negative = { ...validAnalysis, totals: { ...macros, calories: -10 } };
    expect(() => parseNutritionResponse(JSON.stringify(negative))).toThrow(NutritionParseError);
  });
});
