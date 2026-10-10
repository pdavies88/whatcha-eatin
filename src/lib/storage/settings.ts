import Storage from 'expo-sqlite/kv-store';
import { z } from 'zod';

import { DEFAULT_PROVIDER_ID, PROVIDER_IDS } from '@/lib/ai/providers';

const SETTINGS_KEY = 'settings.v1';

export const SettingsSchema = z.object({
  /** The provider used for analysis. It needs a saved API key before photos can be analyzed. */
  providerId: z.enum(PROVIDER_IDS),
  /** Selected model per provider, so switching providers remembers each choice. */
  models: z.partialRecord(z.enum(PROVIDER_IDS), z.string()),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  providerId: DEFAULT_PROVIDER_ID,
  models: {},
};

export function loadSettings(): Settings {
  const raw = Storage.getItemSync(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  const parsed = SettingsSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): Promise<void> {
  return Storage.setItemAsync(SETTINGS_KEY, JSON.stringify(settings));
}
