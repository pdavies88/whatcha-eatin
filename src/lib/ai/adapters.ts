import { buildUserPrompt, SYSTEM_PROMPT } from '@/lib/nutrition/prompt';
import { NUTRITION_JSON_SCHEMA } from '@/lib/nutrition/schema';

import type { ModelOption, ProviderId } from './providers';

export type ImageInput = { base64: string; mimeType: string };

export type AnalysisRequest = {
  apiKey: string;
  model: string;
  image: ImageInput;
  context?: string;
};

export type HttpRequest = { url: string; init: RequestInit };

/**
 * A provider adapter is a pair of pure functions: one builds the HTTP request,
 * the other pulls the model's text out of the JSON response. Keeping them free of
 * I/O makes each provider easy to unit test and reuse on the server.
 */
export type ProviderAdapter = {
  buildRequest: (request: AnalysisRequest) => HttpRequest;
  extractText: (body: any) => string | undefined;
  buildListModelsRequest: (apiKey: string) => HttpRequest;
  parseModelList: (body: any) => ModelOption[];
};

type KeyedProviderId = Exclude<ProviderId, 'free'>;

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const SCHEMA_NAME = 'nutrition_analysis';
const MAX_OUTPUT_TOKENS = 2048;

const dataUrl = (image: ImageInput) => `data:${image.mimeType};base64,${image.base64}`;

const bearer = (apiKey: string) => ({ Authorization: `Bearer ${apiKey}` });

const byId = (a: ModelOption, b: ModelOption) => a.id.localeCompare(b.id);

/** OpenAI's Responses API. */
const openai: ProviderAdapter = {
  buildRequest: ({ apiKey, model, image, context }) => ({
    url: 'https://api.openai.com/v1/responses',
    init: {
      method: 'POST',
      headers: { ...JSON_HEADERS, ...bearer(apiKey) },
      body: JSON.stringify({
        model,
        instructions: SYSTEM_PROMPT,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: buildUserPrompt(context) },
              { type: 'input_image', image_url: dataUrl(image), detail: 'auto' },
            ],
          },
        ],
        text: {
          format: { type: 'json_schema', name: SCHEMA_NAME, strict: true, schema: NUTRITION_JSON_SCHEMA },
        },
        max_output_tokens: MAX_OUTPUT_TOKENS,
      }),
    },
  }),
  extractText: (body) => {
    if (typeof body?.output_text === 'string') return body.output_text;
    for (const item of body?.output ?? []) {
      if (item?.type !== 'message') continue;
      const part = item.content?.find((c: any) => c?.type === 'output_text');
      if (part?.text) return part.text;
    }
    return undefined;
  },
  buildListModelsRequest: (apiKey) => ({
    url: 'https://api.openai.com/v1/models',
    init: { headers: bearer(apiKey) },
  }),
  parseModelList: (body) =>
    (body?.data ?? [])
      .map((m: any) => String(m.id))
      // The endpoint has no capability flags, so keep chat-style GPT and reasoning models.
      .filter((id: string) => /^(gpt-|o\d|chatgpt-)/.test(id) && !/(audio|realtime|tts|transcribe|image|search)/.test(id))
      .map((id: string) => ({ id, label: id }))
      .sort(byId),
};

/** Anthropic's Messages API. */
const anthropic: ProviderAdapter = {
  buildRequest: ({ apiKey, model, image, context }) => ({
    url: 'https://api.anthropic.com/v1/messages',
    init: {
      method: 'POST',
      headers: { ...JSON_HEADERS, ...anthropicHeaders(apiKey) },
      body: JSON.stringify({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: image.mimeType, data: image.base64 } },
              { type: 'text', text: buildUserPrompt(context) },
            ],
          },
        ],
        output_config: { format: { type: 'json_schema', schema: NUTRITION_JSON_SCHEMA } },
      }),
    },
  }),
  extractText: (body) => body?.content?.find((block: any) => block?.type === 'text')?.text,
  buildListModelsRequest: (apiKey) => ({
    url: 'https://api.anthropic.com/v1/models?limit=100',
    init: { headers: anthropicHeaders(apiKey) },
  }),
  parseModelList: (body) =>
    (body?.data ?? []).map((m: any) => ({ id: String(m.id), label: String(m.display_name ?? m.id) })),
};

function anthropicHeaders(apiKey: string) {
  return {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    // Required for calls that originate from a client app rather than a server.
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/** Google's Gemini API (generateContent). */
const gemini: ProviderAdapter = {
  buildRequest: ({ apiKey, model, image, context }) => ({
    url: `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:generateContent`,
    init: {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: 'user',
            parts: [
              { text: buildUserPrompt(context) },
              { inline_data: { mime_type: image.mimeType, data: image.base64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: NUTRITION_JSON_SCHEMA,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      }),
    },
  }),
  extractText: (body) =>
    body?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text ?? '')
      .join('') || undefined,
  buildListModelsRequest: (apiKey) => ({
    url: `${GEMINI_BASE_URL}/models?pageSize=1000`,
    init: { headers: { 'x-goog-api-key': apiKey } },
  }),
  parseModelList: (body) =>
    (body?.models ?? [])
      .filter((m: any) => m?.supportedGenerationMethods?.includes('generateContent'))
      .filter((m: any) => String(m.name).includes('gemini') && !/(tts|embedding|image)/.test(m.name))
      .map((m: any) => ({
        id: String(m.name).replace(/^models\//, ''),
        label: String(m.displayName ?? m.name),
      })),
};

/** Shared Chat Completions adapter for OpenAI-compatible APIs (xAI, OpenRouter). */
function chatCompletions(
  baseUrl: string,
  options: {
    extraHeaders?: Record<string, string>;
    filterModels?: (model: any) => boolean;
  } = {},
): ProviderAdapter {
  return {
    buildRequest: ({ apiKey, model, image, context }) => ({
      url: `${baseUrl}/chat/completions`,
      init: {
        method: 'POST',
        headers: { ...JSON_HEADERS, ...bearer(apiKey), ...options.extraHeaders },
        body: JSON.stringify({
          model,
          max_tokens: MAX_OUTPUT_TOKENS,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text', text: buildUserPrompt(context) },
                { type: 'image_url', image_url: { url: dataUrl(image) } },
              ],
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: { name: SCHEMA_NAME, strict: true, schema: NUTRITION_JSON_SCHEMA },
          },
        }),
      },
    }),
    extractText: (body) => {
      const content = body?.choices?.[0]?.message?.content;
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) return content.map((part: any) => part?.text ?? '').join('');
      return undefined;
    },
    buildListModelsRequest: (apiKey) => ({
      url: `${baseUrl}/models`,
      init: { headers: bearer(apiKey) },
    }),
    parseModelList: (body) =>
      (body?.data ?? [])
        .filter(options.filterModels ?? (() => true))
        .map((m: any) => ({ id: String(m.id), label: String(m.name ?? m.id) }))
        .sort(byId),
  };
}

export const ADAPTERS: Record<KeyedProviderId, ProviderAdapter> = {
  openai,
  anthropic,
  gemini,
  xai: chatCompletions('https://api.x.ai/v1'),
  openrouter: chatCompletions('https://openrouter.ai/api/v1', {
    extraHeaders: { 'X-Title': 'Calorie Macro Helper' },
    filterModels: (m) => m?.architecture?.input_modalities?.includes('image'),
  }),
};
