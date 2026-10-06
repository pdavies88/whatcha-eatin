import { z } from 'zod';

import { ADAPTERS } from '@/lib/ai/adapters';
import { analyzeWithAdapter } from '@/lib/ai/request';
import { AnalysisError } from '@/lib/ai/errors';

/**
 * Server-side endpoint for the free provider. The app sends the photo here when
 * the user has no API key of their own; this route calls a free-tier Gemini model
 * with a key that never leaves the server.
 *
 * Configure with server-only env vars (no EXPO_PUBLIC_ prefix):
 *   FREE_GEMINI_API_KEY  required, from https://aistudio.google.com/app/apikey
 *   FREE_GEMINI_MODEL    optional, defaults to a Flash-Lite model
 */
const DEFAULT_FREE_MODEL = 'gemini-3.5-flash-lite';
/** ~6 MB of base64, well above what the app sends after resizing to 1024px. */
const MAX_IMAGE_BASE64_LENGTH = 8_000_000;

const RequestSchema = z.object({
  image: z.object({
    base64: z.string().min(1).max(MAX_IMAGE_BASE64_LENGTH),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  }),
  context: z.string().max(500).optional(),
});

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.FREE_GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'The free model is not configured on this server. Add your own API key in Settings.' },
      { status: 503 },
    );
  }

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const analysis = await analyzeWithAdapter(
      ADAPTERS.gemini,
      'The free model',
      {
        apiKey,
        model: process.env.FREE_GEMINI_MODEL || DEFAULT_FREE_MODEL,
        image: parsed.data.image,
        context: parsed.data.context,
      },
      request.signal,
    );
    return Response.json(analysis);
  } catch (error) {
    if (error instanceof AnalysisError) {
      // Never forward upstream auth errors verbatim: they describe the server's key, not the user's.
      const status = error.kind === 'auth' ? 502 : (error.status ?? 502);
      const message =
        error.kind === 'auth'
          ? 'The free model is temporarily unavailable. Add your own API key in Settings.'
          : error.message;
      return Response.json({ error: message }, { status });
    }
    return Response.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
