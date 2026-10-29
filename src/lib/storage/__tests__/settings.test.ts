import { describe, expect, it, jest } from '@jest/globals';

import { SettingsSchema } from '../settings';

jest.mock('expo-sqlite/kv-store', () => ({}));

describe('SettingsSchema', () => {
  it('reads settings saved before AI sharing consent existed, with no provider allowed', () => {
    const saved = { providerId: 'gemini', models: { gemini: 'gemini-3.5-flash-lite' } };
    expect(SettingsSchema.parse(saved).aiConsent).toEqual({});
  });

  it('keeps each provider’s consent', () => {
    const saved = { providerId: 'openai', models: {}, aiConsent: { openai: true, gemini: false } };
    expect(SettingsSchema.parse(saved).aiConsent).toEqual({ openai: true, gemini: false });
  });
});
