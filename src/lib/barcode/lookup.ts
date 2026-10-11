import Constants from 'expo-constants';

import { SUPPORT_EMAIL } from '@/constants/brand';
import { AnalysisError } from '@/lib/ai/errors';

import { OPEN_FOOD_FACTS_NAME, openFoodFactsHeaders, parseProductResponse, productUrl, type ProductLookup } from './open-food-facts';

export async function lookupBarcode(barcode: string, signal?: AbortSignal): Promise<ProductLookup> {
  let response: Response;
  try {
    response = await fetch(productUrl(barcode), {
      headers: openFoodFactsHeaders(Constants.expoConfig?.version ?? '1.0.0', SUPPORT_EMAIL),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new AnalysisError('network', `Could not reach ${OPEN_FOOD_FACTS_NAME}. Check your connection and try again.`);
  }

  // Open Food Facts answers 404 for barcodes it doesn't know.
  if (response.status === 404) return { status: 'not_found' };
  if (response.status === 429 || response.status === 503) {
    throw new AnalysisError(
      'rate_limit',
      `${OPEN_FOOD_FACTS_NAME} is busy right now. Wait a minute and try again.`,
      response.status,
    );
  }
  if (!response.ok) {
    throw new AnalysisError('provider', `${OPEN_FOOD_FACTS_NAME} returned an error (${response.status}).`, response.status);
  }

  return parseProductResponse(await response.json().catch(() => null), barcode);
}
