# Whatcha Eatin'

Snap a photo of your meal. A vision model estimates the calories and macros. Your last seven days of meals stay on your phone, then they are cleared automatically.

- **Bring your own key.** Supported providers are Google Gemini, OpenAI, Anthropic, xAI and OpenRouter. There are no accounts, servers or paid tiers.
- **Free with Gemini.** Google gives Gemini API keys away for free. The app has a step-by-step guide for creating one.
- **A rolling week.** The Week tab shows a 7-day calendar with daily totals. When a new day starts, the meals from eight days ago are deleted. On Monday, for example, the previous Monday's meals are removed.
- **On-device only.** Keys are stored in the iOS Keychain. Meals live in on-device SQLite storage and photos in the app's documents folder. Photos go straight from the phone to the provider you choose.

Website, privacy policy and support: https://pdavies88.github.io/whatcha-eatin/

Built with Expo SDK 57, React Native 0.86 (New Architecture), Expo Router, the React Compiler, and TypeScript.

## Getting started

Requirements: Node 24 LTS. For simulator builds you also need Xcode and CocoaPods.

```bash
npm install
npx expo start --go       # scan the QR code with your iPhone's Camera app to open in Expo Go
```

Your phone and Mac must be on the same Wi-Fi network. If the phone can't connect, use `npx expo start --go --tunnel`.

To run a development build on the iOS Simulator instead:

```bash
npx expo run:ios
```

### Getting a free Gemini key

1. Open [Google AI Studio](https://aistudio.google.com/apikey) and sign in with any Google account.
2. Tap **Create API key**. If Google asks for a project, let it create a new one.
3. Copy the key. Create a fresh key instead of reusing an old Google Cloud key, because Google rejects older unrestricted keys.
4. In the app, open **Settings → Google Gemini**, paste the key and save. The Scan tab also links to this guide on first launch.

On the free tier, Google's terms let it use what you send to improve its products.

## Scripts

| Command             | Purpose                     |
| ------------------- | --------------------------- |
| `npm start`         | Start Metro                 |
| `npm test`          | Unit tests (jest-expo)      |
| `npm run typecheck` | TypeScript                  |
| `npm run lint`      | ESLint (eslint-config-expo) |
| `node scripts/generate-brand-assets.mjs` | Re-render the app icon, splash and favicon from the logo |

## How it works

```
src/
  app/                    Expo Router routes
    (tabs)/               Scan, Week, Settings (native tabs)
    meal/[id].tsx         Meal detail
    gemini-key.tsx        Guide for creating a free Gemini key
  components/brand/       Logo (logo-svg.ts is the single source), food shapes, hero, splash overlay
  lib/
    ai/providers.ts       Provider registry and suggested models
    ai/adapters.ts        Pure request builders and response parsers, one per provider
    ai/analyze.ts         Reads the saved key and calls the selected provider
    nutrition/            Zod schema, JSON Schema for structured output, prompt, parsing
    storage/              API keys (SecureStore), settings and meals (SQLite kv-store)
    week.ts               7-day retention window and calendar day math
    image.ts              Resize to 1024px JPEG; store and clean up meal photos
  context/                Settings and meal history providers
plugins/
  with-ios-scene-lifecycle.js   Adopts the UIScene life cycle required by the iOS 27 SDK
```

- Every provider returns structured JSON. The app checks it against a Zod schema. When the check fails, the app shows an error instead of wrong numbers.
- The app deletes expired meals and their photos at launch, when it returns to the foreground, and when you save a meal.
- `plugins/with-ios-scene-lifecycle.js` copies the Expo SDK 58 template. Remove it after upgrading to SDK 58.
- Headings and buttons use the Fredoka font, loaded at startup with `useFonts` so it also works in Expo Go.

## Releasing to TestFlight

You need a paid Apple Developer account and a free Expo account. EAS builds the app in the cloud, so you don't need Xcode for this.

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

On the first run, EAS links the project to your Expo account and asks you to sign in with your Apple ID. It then creates the signing certificate, the provisioning profile and the App Store Connect record. When the upload finishes, add yourself as an internal tester under TestFlight in App Store Connect and install the app with Apple's TestFlight app. Internal TestFlight builds skip App Review and expire after 90 days.

The `preview` profile in `eas.json` makes an ad hoc build instead. You install it straight from a link on devices registered with `npx eas-cli@latest device:create`.

## Releasing to the App Store

[`store/README.md`](store/README.md) has everything App Store Connect asks for: listing copy, keywords, the App Privacy answers, age rating answers, App Review notes and a go-live checklist. The public website, privacy policy and support page live in `docs/` and are served by GitHub Pages.

## License

Copyright (c) 2026 Preston Davies. All rights reserved. See [LICENSE](LICENSE).
