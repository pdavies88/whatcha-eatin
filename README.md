# Calorie Macro Helper

Take a photo of your food. A vision model estimates the calories and macros.

- **Bring your own key:** OpenAI, Anthropic, Google Gemini, xAI, or OpenRouter. Pick any model, load the provider's live model list, or enter a model ID yourself.
- **Free by default:** with no key, photos go to a free-tier Gemini model through the app's own API route. The server's key is never shipped in the app.
- **History:** saved meals and a running total for today.

Built with Expo SDK 57, React Native 0.86 (New Architecture), Expo Router, the React Compiler, and TypeScript.

## Getting started

Requirements: Node 24 LTS, Xcode with an iOS Simulator, and CocoaPods.

```bash
npm install
cp .env.example .env.local   # then add FREE_GEMINI_API_KEY
npx expo run:ios             # builds the native app and starts Metro
```

The app needs a development build (`expo run:ios`), not Expo Go, because it uses native modules.

You can only pick photos from the library in the Simulator, because it has no camera. Use a real device to take photos.

## Scripts

| Command             | Purpose                   |
| ------------------- | ------------------------- |
| `npm start`         | Start Metro               |
| `npm test`          | Unit tests (jest-expo)    |
| `npm run typecheck` | TypeScript                |
| `npm run lint`      | ESLint (eslint-config-expo) |

## How it works

```
src/
  app/                    Expo Router routes
    (tabs)/               Scan, History, Settings (native tabs)
    meal/[id].tsx         Meal detail
    api/analyze+api.ts    Server route for the free provider
  lib/
    ai/providers.ts       Provider registry and suggested models
    ai/adapters.ts        Pure request builders and response parsers, one per provider
    ai/analyze.ts         Client entry point: picks the key and adapter, or calls the free route
    ai/request.ts         Shared fetch, error mapping, and parsing (safe on the server)
    nutrition/            Zod schema, JSON Schema for structured output, prompt, parsing
    storage/              API keys (SecureStore/Keychain), settings and history (SQLite kv-store)
    image.ts              Resize to 1024px JPEG; persist photos for history
  context/                Settings and meal history providers
```

- Every provider uses structured JSON output, and the response is validated with Zod. When validation fails the app shows a clear error, not wrong numbers.
- API keys live in the iOS Keychain (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`). Each key goes only to its own provider.
- If you pick a provider with no saved key, the app falls back to the free model and says so on the Scan screen.

## Deploying the free model

The free provider is an [Expo Router API route](https://docs.expo.dev/router/web/api-routes/). It runs on the Metro dev server during development. For a production build:

1. Deploy the server with [EAS Hosting](https://docs.expo.dev/eas/hosting/get-started/): `npx expo export --platform web && npx eas-cli@latest deploy`.
2. Set `FREE_GEMINI_API_KEY` as an EAS Hosting environment variable.
3. Set the deployed URL as the router origin in `app.json`: `["expo-router", { "origin": "https://your-app.expo.app" }]`.

Gemini's free tier has rate limits. Before a public launch, add per-device rate limiting to the route.
