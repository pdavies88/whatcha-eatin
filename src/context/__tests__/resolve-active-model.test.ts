import { describe, expect, it, jest } from '@jest/globals';

import { resolveActiveModel } from '../settings-context';

jest.mock('expo-secure-store', () => ({}));
jest.mock('expo-sqlite/kv-store', () => ({}));

describe('resolveActiveModel', () => {
  it('returns null until the selected provider has a key', () => {
    expect(resolveActiveModel({ providerId: 'gemini', models: {} }, {})).toBeNull();
    expect(resolveActiveModel({ providerId: 'openai', models: {} }, { gemini: true })).toBeNull();
  });

  it('uses the provider default model when none is saved', () => {
    expect(resolveActiveModel({ providerId: 'gemini', models: {} }, { gemini: true })).toEqual({
      providerId: 'gemini',
      model: 'gemini-3.5-flash-lite',
    });
  });

  it('uses the saved model for the selected provider', () => {
    const settings = { providerId: 'anthropic' as const, models: { anthropic: 'claude-opus-5-5' } };
    expect(resolveActiveModel(settings, { anthropic: true })).toEqual({
      providerId: 'anthropic',
      model: 'claude-opus-5-5',
    });
  });
});
