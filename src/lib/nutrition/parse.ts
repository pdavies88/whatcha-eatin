import { NutritionAnalysisSchema, type NutritionAnalysis } from './schema';

export class NutritionParseError extends Error {
  constructor(
    message: string,
    readonly raw: string,
  ) {
    super(message);
    this.name = 'NutritionParseError';
  }
}

/**
 * Pulls the first JSON object out of a model response. Handles models that wrap
 * output in markdown fences or add prose before/after the object.
 */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new NutritionParseError('The model did not return JSON.', text);
    }
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      throw new NutritionParseError('The model returned malformed JSON.', text);
    }
  }
}

export function parseNutritionResponse(text: string): NutritionAnalysis {
  const result = NutritionAnalysisSchema.safeParse(extractJson(text));
  if (!result.success) {
    throw new NutritionParseError(
      'The model response did not match the expected nutrition format.',
      text,
    );
  }
  return result.data;
}
