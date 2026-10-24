import { useEffect, useRef, useState } from 'react';

import { useSettings } from '@/context/settings-context';
import { analyzeFood } from '@/lib/ai/analyze';
import { PROVIDERS } from '@/lib/ai/providers';
import { prepareImageForAnalysis, type PreparedImage } from '@/lib/image';
import type { NutritionAnalysis } from '@/lib/nutrition/schema';

export type PickedPhoto = { uri: string; width: number; height: number };

/** What the user gave us to look up: a photo of the meal, or a typed description of it. */
export type FoodInput = { kind: 'photo'; photo: PickedPhoto } | { kind: 'text'; description: string };

export type AnalysisState =
  | { status: 'idle' }
  | { status: 'analyzing'; input: FoodInput }
  | {
      status: 'success';
      input: FoodInput;
      /** The resized photo that was sent. Missing for typed meals. */
      photo?: PreparedImage;
      analysis: NutritionAnalysis;
      providerName: string;
      model: string;
    }
  | { status: 'error'; input: FoodInput; message: string };

export function useFoodAnalysis() {
  const { activeModel } = useSettings();
  const [state, setState] = useState<AnalysisState>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight request when the screen unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const analyze = async (input: FoodInput, context?: string) => {
    if (!activeModel) {
      setState({ status: 'error', input, message: 'Add an API key in Settings before looking up meals.' });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const { providerId, model } = activeModel;
    setState({ status: 'analyzing', input });

    try {
      const prepared = input.kind === 'photo' ? await prepareImageForAnalysis(input.photo.uri, input.photo) : undefined;
      const analysis = await analyzeFood({
        providerId,
        model,
        image: prepared ? { base64: prepared.base64, mimeType: prepared.mimeType } : undefined,
        description: input.kind === 'text' ? input.description : undefined,
        context,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setState({
        status: 'success',
        input,
        photo: prepared,
        analysis,
        providerName: PROVIDERS[providerId].name,
        model,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setState({ status: 'error', input, message });
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setState({ status: 'idle' });
  };

  return { state, analyze, reset };
}
