import { describe, expect, it } from '@jest/globals';

import { ADAPTERS } from '../adapters';
import { errorForStatus, providerErrorMessage } from '../errors';

const request = {
  apiKey: 'test-key',
  model: 'test-model',
  image: { base64: 'AAAA', mimeType: 'image/jpeg' },
  context: 'large portion',
};

const bodyOf = (init: RequestInit) => JSON.parse(init.body as string);

describe('openai adapter', () => {
  const { url, init } = ADAPTERS.openai.buildRequest(request);

  it('targets the Responses API with a bearer token', () => {
    expect(url).toBe('https://api.openai.com/v1/responses');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer test-key' });
  });

  it('sends the image as a data URL and requests strict JSON schema output', () => {
    const body = bodyOf(init);
    const content = body.input[0].content;
    expect(content[0].text).toContain('large portion');
    expect(content[1]).toMatchObject({ type: 'input_image', image_url: 'data:image/jpeg;base64,AAAA' });
    expect(body.text.format).toMatchObject({ type: 'json_schema', strict: true });
  });

  it('extracts text from the output array', () => {
    const response = {
      output: [
        { type: 'reasoning', summary: [] },
        { type: 'message', content: [{ type: 'output_text', text: '{"ok":true}' }] },
      ],
    };
    expect(ADAPTERS.openai.extractText(response)).toBe('{"ok":true}');
  });
});

describe('anthropic adapter', () => {
  const { url, init } = ADAPTERS.anthropic.buildRequest(request);

  it('targets the Messages API with the required headers', () => {
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers).toMatchObject({
      'x-api-key': 'test-key',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    });
  });

  it('sends a base64 image block before the text', () => {
    const content = bodyOf(init).messages[0].content;
    expect(content[0]).toEqual({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' },
    });
    expect(content[1].type).toBe('text');
  });

  it('extracts the first text block', () => {
    expect(ADAPTERS.anthropic.extractText({ content: [{ type: 'text', text: '{}' }] })).toBe('{}');
  });
});

describe('gemini adapter', () => {
  const { url, init } = ADAPTERS.gemini.buildRequest(request);

  it('targets generateContent for the model with the key in a header', () => {
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent');
    expect(init.headers).toMatchObject({ 'x-goog-api-key': 'test-key' });
    expect(url).not.toContain('test-key');
  });

  it('requests JSON output with a schema', () => {
    const body = bodyOf(init);
    expect(body.contents[0].parts[1]).toEqual({ inline_data: { mime_type: 'image/jpeg', data: 'AAAA' } });
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseJsonSchema).toBeDefined();
  });

  it('joins text parts from the first candidate', () => {
    const response = { candidates: [{ content: { parts: [{ text: '{"a"' }, { text: ':1}' }] } }] };
    expect(ADAPTERS.gemini.extractText(response)).toBe('{"a":1}');
  });

  it('lists only Gemini models that support generateContent', () => {
    const models = ADAPTERS.gemini.parseModelList({
      models: [
        { name: 'models/gemini-3.8-flash', displayName: 'Gemini 3.8 Flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/text-embedding-005', supportedGenerationMethods: ['embedContent'] },
      ],
    });
    expect(models).toEqual([{ id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' }]);
  });
});

describe.each(['xai', 'openrouter'] as const)('%s chat completions adapter', (providerId) => {
  const { init } = ADAPTERS[providerId].buildRequest(request);

  it('sends an image_url part and a json_schema response format', () => {
    const body = bodyOf(init);
    expect(body.messages[1].content[1]).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/jpeg;base64,AAAA' },
    });
    expect(body.response_format.type).toBe('json_schema');
  });

  it('extracts message content', () => {
    expect(ADAPTERS[providerId].extractText({ choices: [{ message: { content: '{}' } }] })).toBe('{}');
  });
});

it('filters OpenRouter models to those that accept images', () => {
  const models = ADAPTERS.openrouter.parseModelList({
    data: [
      { id: 'a/vision', name: 'Vision', architecture: { input_modalities: ['text', 'image'] } },
      { id: 'b/text', name: 'Text', architecture: { input_modalities: ['text'] } },
    ],
  });
  expect(models).toEqual([{ id: 'a/vision', label: 'Vision' }]);
});

describe('errors', () => {
  it('reads nested and flat provider error messages', () => {
    expect(providerErrorMessage({ error: { message: 'bad key' } })).toBe('bad key');
    expect(providerErrorMessage({ error: 'nope' })).toBe('nope');
    expect(providerErrorMessage(null)).toBeUndefined();
  });

  it('maps HTTP statuses to error kinds', () => {
    expect(errorForStatus(401, 'OpenAI').kind).toBe('auth');
    expect(errorForStatus(429, 'OpenAI').kind).toBe('rate_limit');
    expect(errorForStatus(404, 'OpenAI').kind).toBe('bad_request');
    expect(errorForStatus(500, 'OpenAI').kind).toBe('provider');
  });
});
