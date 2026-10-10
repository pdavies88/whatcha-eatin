# App Store release kit

Everything App Store Connect asks for, ready to paste. Fill these in under **App Store Connect → Apps → Whatcha Eatin'**.

> Never commit an API key to this repo. The reviewer's Gemini key goes only into App Store Connect.

## Go-live checklist

- [ ] Repo is public and GitHub Pages is serving `docs/`. Check that both URLs below open.
- [ ] A TestFlight build installs and works on your iPhone.
- [ ] App information, pricing and the version page are filled in from this file.
- [ ] Screenshots from `store/screenshots/` are uploaded. See [Screenshots](#screenshots).
- [ ] App Privacy questionnaire is answered. See [App Privacy](#app-privacy-questionnaire).
- [ ] Age rating questionnaire is answered.
- [ ] App Review notes include a working Gemini key. See [App Review information](#app-review-information).
- [ ] Build is selected on the version page, then **Add for Review → Submit**.

## URLs

| Field | Value |
| --- | --- |
| Privacy Policy URL | https://pdavies88.github.io/whatcha-eatin/privacy/ |
| Support URL | https://pdavies88.github.io/whatcha-eatin/support/ |
| Marketing URL (optional) | https://pdavies88.github.io/whatcha-eatin/ |

The app links to the same privacy policy and support page from **Settings → About**. Apple requires the privacy policy to be reachable inside the app.

## App information

| Field | Value | Limit |
| --- | --- | --- |
| Name | Whatcha Eatin' | 30 |
| Subtitle | Snap a meal, see your macros | 30 |
| Primary category | Health & Fitness | |
| Secondary category | Food & Drink | |
| Content rights | No, it does not contain, show or access third-party content | |
| Copyright | 2026 Preston Davies | |
| Price | Free | |

If the name is taken, App Store Connect tells you when you create the record. The home-screen name can stay "Whatcha Eatin'" while the listing uses something like "Whatcha Eatin' – Macro Snap".

### Promotional text (170 characters, can change without review)

```
Snap your plate and get calories, protein, carbs and fat in seconds. No account, no subscription, and your meals stay on your phone.
```

### Description (4,000 characters)

```
Whatcha Eatin' estimates the calories and macros in your meal from a single photo.

Snap your plate, and the app breaks it down into each food it sees, with calories, protein, carbs, fat, fiber and sugar. Add a quick note like "cooked in olive oil" or "large bowl" for a better estimate.

A ROLLING WEEK
The Week tab shows a 7-day calendar with your daily totals. Tap any day to see its meals. Older meals clear out automatically, so the app stays light.

NO ACCOUNTS, NO SUBSCRIPTIONS
Whatcha Eatin' uses your own AI key. A Google Gemini key is free, and the app walks you through creating one in about a minute. Prefer another AI? You can also use OpenAI, Anthropic, xAI or OpenRouter, and choose the exact model.

PRIVATE BY DESIGN
- No sign-up and no servers
- No ads, analytics or tracking
- Meals and photos are stored only on your phone
- Photos go straight from your phone to the AI provider you choose, only when you analyze them
- API keys are kept in the iOS Keychain

Calorie and macro numbers are AI estimates and can be off by 20% or more. They are a helpful guide, not medical advice.
```

### Keywords (100 characters, comma-separated, no spaces)

```
calorie,macro,counter,tracker,food,photo,nutrition,protein,diet,meal,log,carbs,AI,scanner
```

Apple doesn't allow other companies' trademarks in keywords, so "Gemini" and "ChatGPT" are left out on purpose.

## App Privacy questionnaire

App Store Connect → **App Privacy → Get Started**.

1. **Do you or your third-party partners collect data from this app?** Yes.
2. **Data types:** select these two and nothing else.
   - **User Content → Photos or Videos**
   - **User Content → Other User Content** (the optional meal notes)
3. For **each** of the two types, answer:
   - **Purpose:** App Functionality only.
   - **Is this data linked to the user's identity?** Yes.
   - **Is this data used for tracking?** No.

The resulting label shows "Data Linked to You: User Content" and "Data Used to Track You: None".

Why these answers:
- **Photos and notes:** when the user analyzes a meal, the photo and any notes go to the AI provider the user selected. Apple counts data sent to a third party as collected when that party can keep it longer than the request takes. Providers can, and Google's free Gemini tier may use it to improve its products.
- **Linked:** each request uses the user's own API key, so the provider can tie it to the user's account. This is the cautious answer.
- **Not collected:** meals, photos and settings stored only on the device. API keys, which never reach the developer and are only sent to the provider as credentials.
- **No tracking:** the app has no analytics, advertising or tracking code.
- **Consistency:** the app's privacy manifest (`ios.privacyManifests` in `app.json`) declares the same two data types, so the build and the label match.

## Age rating

Answer **None** or **No** to every content question: violence, sexual content, profanity, drugs, gambling, horror and so on. Then answer:

| Question | Answer | Why |
| --- | --- | --- |
| Unrestricted web access | No | The app only opens specific links, such as Google AI Studio and its own privacy page. |
| User-generated content shared with others | No | Nothing is shared between users. |
| Messaging or chat | No | |
| Advertising | No | |
| Medical or treatment information | No | It shows nutrition estimates, not medical advice. |
| Health or wellness topics, if asked | Yes | It is a calorie and macro tracker. |

Apple updated this questionnaire in 2025, so the exact wording may differ. The expected result is the lowest age rating.

## App Review information

| Field | Value |
| --- | --- |
| Sign-in required | No |
| Contact name, phone and email | Yours. Apple uses these only to reach you and doesn't show them publicly. |

### Notes

Create a separate Google AI Studio project and key just for App Review, so you can delete it after approval. Paste the key where shown below, in App Store Connect only.

```
Whatcha Eatin' estimates calories and macros from a food photo. It has no accounts and no backend. Each user brings their own AI provider API key, and photos go directly from the device to that provider.

To test, please use this Google Gemini API key (free tier, created for App Review):

<PASTE GEMINI KEY HERE>

Steps:
1. Launch the app. On the Scan tab, tap "Get a free Gemini key".
2. Paste the key above into the field at the bottom and tap Save. The app checks the key with Google and returns to the Scan tab.
3. Tap "Choose from library" (or "Take photo" on a device) and pick a photo of food.
4. The app shows the meal's estimated calories, protein, carbs and fat. Tap "Save to this week".
5. Open the Week tab to see the saved meal and daily totals.

Privacy policy and support links are in Settings → About.
```

Gemini's free tier allows a limited number of requests per day. Leave the key active until the review is approved. Then delete it in Google AI Studio.

## Screenshots

Ready to upload, in [`screenshots/`](screenshots/). All are 1320 × 2868 pixels, the 6.9-inch iPhone size, captured from the iPhone 18 Pro Max simulator with a clean 9:41 status bar. Upload them in this order:

1. `01-scan.png`: Scan tab with the logo, hero and camera buttons
2. `02-meal-result.png`: a meal's photo with its calorie and macro breakdown
3. `03-week.png`: the Week calendar with daily totals and today's meals
4. `04-gemini-key-guide.png`: the free Gemini key guide
5. `05-settings.png`: AI provider choices in Settings

`extra-first-launch.png` shows the first-launch screen asking for a key. Swap it in for one of the five if you prefer.

The meal photos come from Unsplash under its free license. See [`screenshots/CREDITS.md`](screenshots/CREDITS.md). The meals and numbers are sample data loaded straight into the simulator app's storage, not live AI results.

To retake them later, run the app on the iPhone 18 Pro Max simulator, set the status bar with `xcrun simctl status_bar booted override --time 9:41 --batteryState discharging --batteryLevel 100`, and save each screen with `xcrun simctl io booted screenshot <file>.png`. Save the files outside the project folder while Metro is running. A new file in the project makes Metro reload the app mid-capture.

## After approval

- Choose **Manually release this version** on the version page if you want to pick the launch day.
- Delete the App Review Gemini key in Google AI Studio.
- For each update, bump `version` in `app.json`. EAS increments the build number automatically.
