import { describe, expect, it, jest } from '@jest/globals';

import { resolveActiveModel } from '../settings-context';

jest.mock('expo-secure-store', () => ({}));
jest.mock('expo-sqlite/kv-store', () => ({}));

describe('resolveActiveModel', () => {
  it('uses the free provider by default', () => {
    expect(resolveActiveModel({ providerId: 'free', models: {} }, {})).toEqual({
      providerId: 'free',
      model: 'default',
      isFallback: false,
    });
  });

  it('uses the preferred provider and its saved model when a key exists', () => {
    const settings = { providerId: 'anthropic' as const, models: { anthropic: 'claude-opus-5-5' } };
    expect(resolveActiveModel(settings, { anthropic: true })).toEqual({
      providerId: 'anthropic',
      model: 'claude-opus-5-5',
      isFallback: false,
    });
  });

  it('falls back to the free provider when the preferred provider has no key', () => {
    expect(resolveActiveModel({ providerId: 'openai', models: {} }, { openai: false })).toEqual({
      providerId: 'free',
      model: 'default',
      isFallback: true,
    });
  });
});
