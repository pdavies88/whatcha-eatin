import type { NutritionAnalysis } from '@/lib/nutrition/schema';
import { getApiKey } from '@/lib/storage/api-keys';

import { ADAPTERS, type ImageInput } from './adapters';
import { AnalysisError } from './errors';
import { PROVIDERS, type ModelOption, type ProviderId } from './providers';
import { analyzeWithAdapter, fetchJson } from './request';

export type AnalyzeOptions = {
  providerId: ProviderId;
  model: string;
  image: ImageInput;
  context?: string;
  signal?: AbortSignal;
};

/** Path of the app's own API route that serves the free, keyless provider. */
export const FREE_ANALYZE_PATH = '/api/analyze';

export async function analyzeFoodImage(options: AnalyzeOptions): Promise<NutritionAnalysis> {
  const { providerId, model, image, context, signal } = options;
  const provider = PROVIDERS[providerId];

  if (providerId === 'free') {
    const body = await fetchJson(
      FREE_ANALYZE_PATH,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, context }),
        signal,
      },
      provider.name,
    );
    return body as NutritionAnalysis;
  }

  const apiKey = await getApiKey(providerId);
  if (!apiKey) {
    throw new AnalysisError('auth', `Add a ${provider.name} API key in Settings to use this provider.`);
  }

  return analyzeWithAdapter(ADAPTERS[providerId], provider.name, { apiKey, model, image, context }, signal);
}

export async function listProviderModels(providerId: ProviderId, signal?: AbortSignal): Promise<ModelOption[]> {
  if (providerId === 'free') return PROVIDERS.free.suggestedModels;

  const apiKey = await getApiKey(providerId);
  if (!apiKey) {
    throw new AnalysisError('auth', `Add a ${PROVIDERS[providerId].name} API key first.`);
  }
  const adapter = ADAPTERS[providerId];
  const { url, init } = adapter.buildListModelsRequest(apiKey);
  const body = await fetchJson(url, { ...init, signal }, PROVIDERS[providerId].name);
  return adapter.parseModelList(body);
}
