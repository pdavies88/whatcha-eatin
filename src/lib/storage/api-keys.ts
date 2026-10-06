import * as SecureStore from 'expo-secure-store';

import type { ProviderId } from '@/lib/ai/providers';

// API keys live in the iOS Keychain / Android Keystore, never in plain app storage.
const storageKey = (provider: ProviderId) => `apiKey.${provider}`;

export function getApiKey(provider: ProviderId): Promise<string | null> {
  return SecureStore.getItemAsync(storageKey(provider));
}

export async function setApiKey(provider: ProviderId, key: string): Promise<void> {
  const trimmed = key.trim();
  if (trimmed) {
    await SecureStore.setItemAsync(storageKey(provider), trimmed, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } else {
    await SecureStore.deleteItemAsync(storageKey(provider));
  }
}
