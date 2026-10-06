import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { PROVIDERS, PROVIDER_IDS, type ProviderId } from '@/lib/ai/providers';
import { getApiKey, setApiKey as persistApiKey } from '@/lib/storage/api-keys';
import { loadSettings, saveSettings, type Settings } from '@/lib/storage/settings';

type ApiKeyState = Partial<Record<ProviderId, boolean>>;

export type ActiveModel = {
  providerId: ProviderId;
  model: string;
  /** True when the preferred provider has no key and the free provider is used instead. */
  isFallback: boolean;
};

type SettingsContextValue = {
  settings: Settings;
  /** Which providers have a stored key. Keys themselves are only read when making a request. */
  hasApiKey: ApiKeyState;
  activeModel: ActiveModel;
  selectProvider: (providerId: ProviderId) => void;
  selectModel: (providerId: ProviderId, model: string) => void;
  saveApiKey: (providerId: ProviderId, key: string) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function modelFor(settings: Settings, providerId: ProviderId): string {
  return settings.models[providerId] ?? PROVIDERS[providerId].defaultModel;
}

export function resolveActiveModel(settings: Settings, hasApiKey: ApiKeyState): ActiveModel {
  const preferred = PROVIDERS[settings.providerId];
  if (!preferred.requiresKey || hasApiKey[settings.providerId]) {
    return { providerId: settings.providerId, model: modelFor(settings, settings.providerId), isFallback: false };
  }
  return { providerId: 'free', model: modelFor(settings, 'free'), isFallback: true };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Settings are read synchronously so the first render already reflects the user's choice.
  const [settings, setSettings] = useState(loadSettings);
  const [hasApiKey, setHasApiKey] = useState<ApiKeyState>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      PROVIDER_IDS.map(async (id) => [id, Boolean(await getApiKey(id))] as const),
    ).then((entries) => {
      if (!cancelled) setHasApiKey(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = (update: (previous: Settings) => Settings) => {
    setSettings((previous) => {
      const next = update(previous);
      void saveSettings(next);
      return next;
    });
  };

  const value: SettingsContextValue = {
    settings,
    hasApiKey,
    activeModel: resolveActiveModel(settings, hasApiKey),
    selectProvider: (providerId) => updateSettings((previous) => ({ ...previous, providerId })),
    selectModel: (providerId, model) =>
      updateSettings((previous) => ({
        ...previous,
        models: { ...previous.models, [providerId]: model },
      })),
    saveApiKey: async (providerId, key) => {
      await persistApiKey(providerId, key);
      setHasApiKey((previous) => ({ ...previous, [providerId]: key.trim().length > 0 }));
    },
  };

  return <SettingsContext value={value}>{children}</SettingsContext>;
}

export function useSettings(): SettingsContextValue {
  const context = use(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
