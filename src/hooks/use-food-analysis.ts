import { useEffect, useRef, useState } from 'react';

import { useSettings } from '@/context/settings-context';
import { analyzeFoodImage } from '@/lib/ai/analyze';
import { PROVIDERS } from '@/lib/ai/providers';
import { prepareImageForAnalysis, type PreparedImage } from '@/lib/image';
import type { NutritionAnalysis } from '@/lib/nutrition/schema';

export type PickedPhoto = { uri: string; width: number; height: number };

export type AnalysisState =
  | { status: 'idle' }
  | { status: 'analyzing'; photo: PickedPhoto }
  | {
      status: 'success';
      photo: PreparedImage;
      analysis: NutritionAnalysis;
      providerName: string;
      model: string;
    }
  | { status: 'error'; photo: PickedPhoto; message: string };

export function useFoodAnalysis() {
  const { activeModel } = useSettings();
  const [state, setState] = useState<AnalysisState>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight request when the screen unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const analyze = async (photo: PickedPhoto, context?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const { providerId, model } = activeModel;
    setState({ status: 'analyzing', photo });

    try {
      const prepared = await prepareImageForAnalysis(photo.uri, photo);
      const analysis = await analyzeFoodImage({
        providerId,
        model,
        image: { base64: prepared.base64, mimeType: prepared.mimeType },
        context,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setState({
        status: 'success',
        photo: prepared,
        analysis,
        providerName: PROVIDERS[providerId].name,
        model,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setState({ status: 'error', photo, message });
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setState({ status: 'idle' });
  };

  return { state, analyze, reset };
}
