export const PROVIDER_IDS = ['free', 'openai', 'anthropic', 'gemini', 'xai', 'openrouter'] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ModelOption = { id: string; label: string };

export type ProviderConfig = {
  id: ProviderId;
  name: string;
  description: string;
  requiresKey: boolean;
  /** Where a user can create an API key. */
  keyUrl?: string;
  defaultModel: string;
  /** Curated vision-capable models. Users can also load the live list or enter any model ID. */
  suggestedModels: ModelOption[];
};

export const DEFAULT_PROVIDER_ID: ProviderId = 'free';

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'No key needed. Runs a free-tier model through the app server, so it can be rate limited.',
    requiresKey: false,
    defaultModel: 'default',
    suggestedModels: [{ id: 'default', label: 'Gemini Flash-Lite' }],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models via the OpenAI Responses API.',
    requiresKey: true,
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
    requiresKey: true,
    keyUrl: 'https://console.anthropic.com/settings/keys',
    defaultModel: 'claude-sonnet-5-5',
    suggestedModels: [
      { id: 'claude-fable-5-1', label: 'Claude Fable 5.1 (most capable)' },
      { id: 'claude-opus-5-5', label: 'Claude Opus 5.5' },
      { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (balanced)' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fast, cheap)' },
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini models via the Gemini API. Google offers a free tier.',
    requiresKey: true,
    keyUrl: 'https://aistudio.google.com/app/apikey',
    defaultModel: 'gemini-3.8-flash',
    suggestedModels: [
      { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (most capable)' },
      { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (balanced)' },
      { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (fast, cheap)' },
    ],
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    description: 'Grok models via the xAI API.',
    requiresKey: true,
    keyUrl: 'https://console.x.ai',
    defaultModel: 'grok-4.7',
    suggestedModels: [{ id: 'grok-4.7', label: 'Grok 4.7' }],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'One key for hundreds of models from every major lab.',
    requiresKey: true,
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
