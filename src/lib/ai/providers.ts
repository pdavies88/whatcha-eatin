// Gemini comes first because it is the only major provider with a free tier.
export const PROVIDER_IDS = ['gemini', 'openai', 'anthropic', 'xai', 'openrouter'] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ModelOption = { id: string; label: string };

export type ProviderConfig = {
  id: ProviderId;
  name: string;
  description: string;
  /** True when the provider offers a no-cost API tier. */
  hasFreeTier: boolean;
  /** Where a user can create an API key. */
  keyUrl?: string;
  defaultModel: string;
  /** Curated vision-capable models. Users can also load the live list or enter any model ID. */
  suggestedModels: ModelOption[];
};

export const DEFAULT_PROVIDER_ID: ProviderId = 'gemini';

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini models from Google. A free key from Google AI Studio is enough to use the app.',
    hasFreeTier: true,
    keyUrl: 'https://aistudio.google.com/apikey',
    defaultModel: 'gemini-3.5-flash-lite',
    suggestedModels: [
      { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (fast)' },
      { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
      { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (newest)' },
      { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (paid plans)' },
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models via the OpenAI Responses API.',
    hasFreeTier: false,
    keyUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-6.1-sol',
    suggestedModels: [
      { id: 'gpt-6-astra', label: 'GPT-6 Astra (most capable)' },
      { id: 'gpt-6.1-sol', label: 'GPT-6.1 Sol (balanced)' },
      { id: 'gpt-6-luna', label: 'GPT-6 Luna (fast, cheap)' },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models via the Anthropic Messages API.',
    hasFreeTier: false,
    keyUrl: 'https://console.anthropic.com/settings/keys',
    defaultModel: 'claude-sonnet-5-5',
    suggestedModels: [
      { id: 'claude-fable-5-1', label: 'Claude Fable 5.1 (most capable)' },
      { id: 'claude-opus-5-5', label: 'Claude Opus 5.5' },
      { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (balanced)' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fast, cheap)' },
    ],
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    description: 'Grok models via the xAI API.',
    hasFreeTier: false,
    keyUrl: 'https://console.x.ai',
    defaultModel: 'grok-4.7',
    suggestedModels: [{ id: 'grok-4.7', label: 'Grok 4.7' }],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'One key for hundreds of models from every major lab.',
    hasFreeTier: false,
    keyUrl: 'https://openrouter.ai/settings/keys',
    defaultModel: 'google/gemini-3.8-flash',
    suggestedModels: [
      { id: 'google/gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
      { id: 'anthropic/claude-sonnet-5.5', label: 'Claude Sonnet 5.5' },
      { id: 'openai/gpt-6-luna', label: 'GPT-6 Luna' },
      { id: 'x-ai/grok-4.7', label: 'Grok 4.7' },
    ],
  },
};
