// Request helpers kept free of native modules so they can be unit tested.
import { NutritionParseError, parseNutritionResponse } from '@/lib/nutrition/parse';
import type { NutritionAnalysis } from '@/lib/nutrition/schema';

import type { ProviderAdapter } from './adapters';
import { AnalysisError, errorForStatus, providerErrorMessage } from './errors';

/** Runs a single analysis through a provider adapter. */
export async function analyzeWithAdapter(
  adapter: ProviderAdapter,
  providerName: string,
  request: Parameters<ProviderAdapter['buildRequest']>[0],
  signal?: AbortSignal,
): Promise<NutritionAnalysis> {
  const { url, init } = adapter.buildRequest(request);
  const body = await fetchJson(url, { ...init, signal }, providerName);

  const text = adapter.extractText(body);
  if (!text) {
    throw new AnalysisError('parse', `${providerName} returned an empty response. Try again or pick another model.`);
  }

  try {
    return parseNutritionResponse(text);
  } catch (error) {
    if (error instanceof NutritionParseError) {
      throw new AnalysisError('parse', `${error.message} Try again or pick a more capable model.`);
    }
    throw error;
  }
}

export async function fetchJson(url: string, init: RequestInit, providerName: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new AnalysisError('network', `Could not reach ${providerName}. Check your connection and try again.`);
  }

  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw errorForStatus(response.status, providerName, providerErrorMessage(body));
  }
  if (body === undefined) {
    throw new AnalysisError('parse', `${providerName} returned a response that was not JSON.`);
  }
  return body;
}
