# Android: Play Store internal testing

This guide gets Whatcha Eatin' onto a few people's Android phones, such as family, through Google Play's **internal testing** track. Up to 100 invited testers install it from the Play Store and get updates automatically.

Internal testing doesn't need the 12-tester, 14-day closed test. That rule only applies before a public Production release.

Play Console screens change often, so labels may differ slightly from the ones below.

## 1. Create a Google Play Console account

1. Go to <https://play.google.com/console> and sign in with the Google account you want to own the app.
2. Choose **Yourself** (a personal account).
3. Pay the one-time $25 fee. Then complete identity verification, which can take a few days.
4. Google may also ask you to verify a phone number and an Android device using the Play Console mobile app.

## 2. Create the app

**Home → Create app**:

| Field | Value |
| --- | --- |
| App name | Whatcha Eatin' |
| Default language | English (United States) |
| App or game | App |
| Free or paid | Free |
| Declarations | Tick both boxes (developer policies and US export laws) |

## 3. Build the Android app

From the project folder:

```bash
npx eas-cli@latest build --platform android --profile production
```

- **Signing key:** on the first run, EAS asks to create an Android keystore. Answer **Yes**. EAS stores it, and every future update must use the same key, so don't delete it.
- **Build:** EAS builds an Android App Bundle (`.aab`) in the cloud. This takes about 10–20 minutes.
- **Download:** when it finishes, download the `.aab` from the link it prints, or from the build page on expo.dev.

## 4. Upload the first release by hand

The first upload is easiest by hand. Later uploads can be automatic (see step 7).

1. In Play Console: **Test and release → Testing → Internal testing**.
2. **Testers** tab:
   - Click **Create email list** and name it, for example, "Family".
   - Add your mom's Gmail address and your own. It must be the Google account she uses for the Play Store on her phone.
   - Save, then tick the list.
3. **Releases** tab: **Create new release**.
   - If Google asks about **Play App Signing**, accept the default, **Use Google-generated key**.
   - Drag in the `.aab` file.
   - Release name: `1.1.0`. Release notes: `First Android release.`
4. Click **Next**, then **Save and publish** (or **Start rollout to Internal testing**).

If Play Console won't publish, it lists the setup tasks it still needs. Answers for those are in section 5.

## 4a. Main store listing

Play Console requires the main store listing before it will publish, even for internal testing. Fill it in under **Grow users → Store presence → Main store listing**.

| Field | Value |
| --- | --- |
| App name | `Whatcha Eatin'` |
| Short description (76/80) | `Snap a meal or scan a barcode to see calories and macros. No account needed.` |
| App icon | `play-icon-512.png` (512 × 512) |
| Feature graphic | `feature-graphic-1024x500.png` (1024 × 500) |
| Phone screenshots | All seven in `screenshots/`, in number order (1320 × 2640) |

Leave tablet and Chromebook screenshots empty. They're optional.

### Full description (1582/4000)

```
Whatcha Eatin' estimates the calories and macros in your meal from a single photo.

Snap your plate, and the app breaks it down into each food it sees, with calories, protein, carbs, fat, fiber and sugar. Add a quick note like "cooked in olive oil" or "large bowl" for a better estimate.

SCAN PACKAGED FOOD
Eating a bag of chips or a protein bar? Scan its barcode instead. Whatcha Eatin' looks it up in the free Open Food Facts database and logs the label's nutrition and the product photo. Barcode scanning doesn't need an AI key.

YOUR DAILY TARGETS
Add your age, height, weight and activity level to see how many calories, protein, carbs and fat you need each day to lose, maintain or gain weight. Each day in your week is compared with the goal you pick.

A ROLLING WEEK
The Week tab shows a 7-day calendar with your daily totals. Tap any day to see its meals. Older meals clear out automatically, so the app stays light.

NO ACCOUNTS, NO SUBSCRIPTIONS
Whatcha Eatin' uses your own AI key. A Google Gemini key is free, and the app walks you through creating one in about a minute. Prefer another AI? You can also use OpenAI, Anthropic, xAI or OpenRouter, and choose the exact model.

PRIVATE BY DESIGN
- No sign-up and no servers
- No ads, analytics or tracking
- Meals and photos are stored only on your phone
- Photos go straight from your phone to the AI provider you choose, only when you analyze them
- API keys are kept in your phone's secure storage

Calorie and macro numbers are AI estimates and can be off by 20% or more. They are a helpful guide, not medical advice.
```

### Store settings

Fill these in under **Grow users → Store presence → Store settings**.

| Field | Value |
| --- | --- |
| App category | Health & Fitness |
| Tags | Pick up to five, for example: Calorie counter, Diet & nutrition, Food tracker |
| Email address | `preston5@protonmail.com` |
| Website | `https://pdavies88.github.io/whatcha-eatin/` |
| Phone | Leave empty |

To rebuild the feature graphic and screenshots after changing the logo or the iPhone screenshots, run `node scripts/generate-play-assets.mjs`.

## 5. App content answers

You'll find these under **Policy and programs → App content**, or on the dashboard's **Set up your app** list.

| Form | Answer |
| --- | --- |
| Privacy policy | `https://pdavies88.github.io/whatcha-eatin/privacy/` |
| App access | All functionality is available without special access. The AI features need the user's own API key, which the app explains how to get for free. If asked, add a test Gemini key with the steps from `store/README.md`. |
| Ads | No, the app does not contain ads |
| Content rating | Category **Reference, News, or Educational** (or **All Other App Types**). Answer **No** to every content question. |
| Target audience | **18 and over**. The daily targets are designed for adults. |
| News app | No |
| Health apps | Choose the nutrition, weight management or fitness option. Choose none of the medical options. It is not a medical device. |
| Government app | No |
| Financial features | None |

### Data safety

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | Yes |
| Is all data encrypted in transit? | Yes (all requests use HTTPS) |
| Can users request that their data be deleted? | No account data is held by the developer. Meals are stored on the device and deleted after 7 days or by the user. Choose the option that fits, or explain this in the deletion field if one is shown. |

Data types to declare. All are **optional**, used only for **App functionality**, and **not processed ephemerally**, because the provider may keep them:

| Data type | Collected | Shared | Why |
| --- | --- | --- | --- |
| Photos and videos → **Photos** | Yes | Yes | A photo you analyze goes to the AI provider you chose. |
| App activity → **Other user-generated content** | Yes | Yes | Optional meal notes go to the AI provider with the photo. |
| App activity → **In-app search history** | Yes | Yes | Scanned barcode numbers go to Open Food Facts to look up the product. |

The profile (age, sex, height, weight, activity and goal) never leaves the phone, so don't declare it.

## 6. Install on your mom's phone

1. In **Internal testing → Testers**, copy the **Join on the web** link (the opt-in URL).
2. Send it to her. She opens it on her phone while signed in to the same Google account, taps **Accept invite**, then **Download it on Google Play**.
3. She installs **Whatcha Eatin'** like any other app. It can take up to an hour after publishing for the app to appear.

Things to check on her phone:

- Text fields stay above the keyboard: the API key field in Settings, and the profile form on the Week tab.
- The barcode scanner opens the camera.
- The splash screen, icon and fonts look right.

## 7. Future updates

1. Bump `version` in `app.json` for user-visible releases. EAS raises the Android `versionCode` automatically.
2. Build again with step 3's command and upload the new `.aab` to **Internal testing → Create new release**. Testers get the update automatically.

**Optional automatic uploads:** create a Google Cloud service account with access to your Play Console. Follow <https://docs.expo.dev/submit/android/> and add the key with `npx eas-cli@latest credentials --platform android`. Then this one command builds and uploads:

```bash
npx eas-cli@latest build --platform android --profile production --auto-submit
```

`eas.json` sends these uploads to the internal track as a **draft**, because Google only accepts drafts for apps that haven't been published publicly. Open Play Console and click **Start rollout** on the draft to deliver it.

## Going public later

A public Production release needs one of these:

- a closed test with at least 12 testers opted in for 14 days in a row (personal accounts created after November 13, 2023), or
- an organization account with a D-U-N-S number.

It also needs a full store listing: a short description (80 characters), a full description, a 512 × 512 icon (`play-icon-512.png` in this folder), a 1024 × 500 feature graphic and phone screenshots.
