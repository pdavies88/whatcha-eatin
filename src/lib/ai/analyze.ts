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

/** Sends the photo straight from the device to the user's chosen provider with their own key. */
export async function analyzeFoodImage(options: AnalyzeOptions): Promise<NutritionAnalysis> {
  const { providerId, model, image, context, signal } = options;
  const provider = PROVIDERS[providerId];

  const apiKey = await getApiKey(providerId);
  if (!apiKey) {
    throw new AnalysisError('auth', `Add a ${provider.name} API key in Settings to use this provider.`);
  }

  return analyzeWithAdapter(ADAPTERS[providerId], provider.name, { apiKey, model, image, context }, signal);
}

export async function listProviderModels(providerId: ProviderId, signal?: AbortSignal): Promise<ModelOption[]> {
  const apiKey = await getApiKey(providerId);
  if (!apiKey) {
    throw new AnalysisError('auth', `Add a ${PROVIDERS[providerId].name} API key first.`);
  }
  const adapter = ADAPTERS[providerId];
  const { url, init } = adapter.buildListModelsRequest(apiKey);
  const body = await fetchJson(url, { ...init, signal }, PROVIDERS[providerId].name);
  return adapter.parseModelList(body);
}
