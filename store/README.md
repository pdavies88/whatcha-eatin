# App Store release kit

Everything App Store Connect asks for, ready to paste. Fill these in under **App Store Connect → Apps → Whatcha Eatin'**.

> Never commit an API key to this repo. The reviewer's Gemini key goes only into App Store Connect.

## Go-live checklist

- [ ] Repo is public and GitHub Pages is serving `docs/`. Check that both URLs below open.
- [ ] A TestFlight build installs and works on your iPhone.
- [ ] App information, pricing and the version page are filled in from this file.
- [ ] Screenshots from `store/screenshots/` are uploaded. See [Screenshots](#screenshots).
- [ ] The build was made with Xcode 27.1 or later, so it's optimized for iPhone Duo. EAS's default SDK 58 image uses Xcode 27.1. See [iPhone Duo](#iphone-duo).
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
Snap your plate and get calories, protein, carbs and fat in seconds. Now optimized for iPhone Duo. No account, no subscription, and meals stay on your phone.
```

### Description (4,000 characters)

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

OPTIMIZED FOR IPHONE DUO
Whatcha Eatin' fills both iPhone Duo displays. It adapts as you fold and unfold, in portrait or landscape, without restarting.

ACCESSIBLE
Works with VoiceOver, Dynamic Type and Reduce Motion, with high-contrast colors in light and dark mode.

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

### What's New in this version (4,000 characters)

App Store Connect shows this field only for updates. Skip it for the first release.

```
Now optimized for iPhone Duo. Whatcha Eatin' fills the inner and outer displays, adapts as you fold and unfold, and works in landscape.

Also new:
- A redesigned look, with a new Log tab and week view
- Type what you ate to look it up, no photo needed
- Better VoiceOver support, higher-contrast colors and larger tap targets
- The hero animation stops when Reduce Motion is on
```

## App Privacy questionnaire

App Store Connect → **App Privacy → Get Started**.

1. **Do you or your third-party partners collect data from this app?** Yes.
2. **Data types:** select these three and nothing else.
   - **User Content → Photos or Videos**
   - **User Content → Other User Content** (the optional meal notes)
   - **Search History** (barcode lookups)
3. For **Photos or Videos** and **Other User Content**, answer:
   - **Purpose:** App Functionality only.
   - **Is this data linked to the user's identity?** Yes.
   - **Is this data used for tracking?** No.
4. For **Search History**, answer:
   - **Purpose:** App Functionality only.
   - **Is this data linked to the user's identity?** No.
   - **Is this data used for tracking?** No.

The resulting label shows "Data Linked to You: User Content", "Data Not Linked to You: Search History" and "Data Used to Track You: None".

Why these answers:
- **Photos and notes:** when the user analyzes a meal, the photo and any notes go to the AI provider the user selected. Apple counts data sent to a third party as collected when that party can keep it longer than the request takes. Providers can, and Google's free Gemini tier may use it to improve its products.
- **Linked:** each request uses the user's own API key, so the provider can tie it to the user's account. This is the cautious answer.
- **Barcode lookups:** scanning sends only the barcode number to Open Food Facts, with no key, account or personal details. Open Food Facts can still log the lookup, so it is declared as Search History that isn't linked to the user.
- **Not collected:** meals, photos, settings and the optional profile (age, sex, height, weight, activity, goal), which are stored only on the device. API keys, which never reach the developer and are only sent to the provider as credentials.
- **No tracking:** the app has no analytics, advertising or tracking code.
- **Consistency:** the app's privacy manifest (`ios.privacyManifests` in `app.json`) declares the same three data types, so the build and the label match.

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

These notes also answer the six questions in Apple's "Guideline 2.1 - Information Needed" request, which new developer accounts get. Paste the same text as your reply in App Store Connect **and** into the App Review **Notes** field. The Notes field allows 4,000 characters, and this text is about 3,900 with a key pasted in. The privacy policy and support URLs have their own fields, so the notes leave them out.

```
1. SCREEN RECORDING
Attached: a recording on a physical iPhone running the latest iOS, starting from launch. It shows setting up a free AI key, analyzing a meal photo, scanning a barcode, the week view, daily targets and deleting a meal. The app has no account registration or login, no user-generated content shared with other users, and no paid content or in-app purchases.

2. PURPOSE AND AUDIENCE
Whatcha Eatin' helps adults (18+) understand what they eat, quickly: take a photo of a meal and an AI model estimates the calories, protein, carbs, fat, fiber and sugar of each food it sees, or scan the barcode of packaged food to log its label nutrition. Meals are kept for a rolling 7 days, and optional daily targets show how much to eat to lose, maintain or gain weight. Data stays on the device, with no accounts, ads, analytics or subscriptions.

3. SETUP AND TEST INSTRUCTIONS
No login is needed. AI photo analysis uses the user's own AI provider key; Google provides Gemini keys for free, and the app includes a step-by-step guide. Please use this Gemini key, created for App Review:

<PASTE GEMINI KEY HERE>

a. Launch the app. On the Scan tab, tap "Get a free Gemini key".
b. Paste the key into the field at the bottom and tap Save. The app checks the key with Google and returns to the Scan tab.
c. Tap "Take photo" and photograph any food (or "Choose from library"). The app shows the estimated calories and macros. Tap "Save to this week".
d. Barcode scanning needs no key: tap "Scan a barcode" and scan any packaged food, or type 028400090858 (Lay's Classic Potato Chips) and tap "Look up". Tap "Save to this week".
e. Open the Week tab to see the 7-day calendar and today's meals. Tap a meal, then "Delete meal" to remove it.
f. On the Week tab, tap "Add your details" and enter any adult age, height and weight to see daily calorie and macro targets.
g. Settings lets users choose an AI provider and model. Settings > About links to the privacy policy and support.
No sample files are needed.

4. EXTERNAL SERVICES
- Google Gemini API (default AI provider), called directly from the device with the user's own key to analyze meal photos.
- Optional alternative AI providers, also with the user's own key: OpenAI, Anthropic, xAI and OpenRouter.
- Open Food Facts (open, free food database) to look up packaged foods by barcode. Only the barcode number is sent.
- Google AI Studio website, opened in an in-app browser, where users create a free Gemini key.
The app has no backend server, authentication service, payment processor, analytics or advertising SDK.

5. REGIONAL DIFFERENCES
The app works the same in every region. All features are available everywhere, and users can choose US or metric units. The only difference is outside the app: each AI provider decides which countries its API serves, so if one provider is unavailable in a user's country, they can choose another provider in Settings.

6. REGULATED INDUSTRY AND THIRD-PARTY MATERIAL
The app is not a medical device and does not diagnose, treat or manage any medical condition. It gives general wellness nutrition estimates for adults, says in the app that estimates are not medical advice, and advises people with medical conditions, or who are pregnant, to consult a doctor. Daily targets use the published Mifflin-St Jeor equation with safe minimum calorie levels, are not shown to users under 18, and include no weight-loss target for users with a BMI under 18.5.
No protected third-party material is used. Barcode product data and photos come from Open Food Facts under the Open Database License and CC BY-SA, and are credited in the app. Food photos in the App Store screenshots are from Unsplash under the Unsplash License.

7. IPHONE DUO
Built with the iOS 27.1 SDK and optimized for iPhone Duo. The app adapts to the outer and inner displays, folded or unfolded, in portrait and landscape.
```

Gemini's free tier allows a limited number of requests per day. Leave the key active until the review is approved. Then delete it in Google AI Studio.

### Screen recording for App Review

Apple asks for a recording on a physical iPhone running the latest iOS, starting from launch.

1. Update the iPhone to the latest iOS. Delete the app, then reinstall the build you submitted from TestFlight, so the first-run setup appears.
2. Add **Screen Recording** to Control Center (Settings → Control Center) if it isn't there. Swipe down from the top right and tap the record button. The countdown gives you 3 seconds.
3. Record this flow, slowly, in about 2–3 minutes:
   1. On the Home Screen, tap the app icon.
   2. Scan tab: tap **Get a free Gemini key**, scroll the guide, paste the review key and tap **Save**. Don't open Google AI Studio on camera, because it shows your account.
   3. Tap **Take photo** and photograph real food. Wait for the result, then tap **Save to this week**.
   4. Tap **Scan a barcode** and scan a packaged food. Change the servings, then tap **Save to this week**.
   5. Week tab: show the calendar and today's meals. Tap a meal, scroll it, then tap **Delete meal** and confirm.
   6. Tap **Add your details**, fill in the form and **Save** to show the daily targets.
   7. Settings: show the providers and models, then **About → Privacy policy**.
4. Stop recording from the red status indicator. The video is saved to Photos.
5. AirDrop it to your Mac. Attach it to your reply in App Store Connect. If the upload is too large, export a smaller copy with QuickTime (File → Export As → 1080p) and try again.

## Screenshots

Ready to upload, in [`screenshots/`](screenshots/). All are 1320 × 2868 pixels, the 6.9-inch iPhone size, captured from the iPhone 18 Pro Max simulator with a clean 9:41 status bar. Upload them in this order:

1. `01-scan.png`: Scan tab with the logo, hero and the photo and barcode buttons
2. `02-meal-result.png`: a meal's photo with its calorie and macro breakdown
3. `03-barcode-result.png`: a scanned bag of chips with its product photo and label nutrition
4. `04-daily-targets.png`: lose, maintain and gain targets on the Week tab
5. `05-week.png`: the 7-day calendar with daily totals and today's meals
6. `06-gemini-key-guide.png`: the free Gemini key guide
7. `07-settings.png`: AI provider choices in Settings

`6.3-inch/` has the same seven screenshots at 1206 × 2622, for App Store Connect's 6.1"/6.3" display slot. Regenerate them after retaking with `for f in 0*.png; do sips -z 2622 1206 "$f" --out "6.3-inch/$f"; done` from `store/screenshots/`.

Apple allows up to 10 screenshots. The first three show in search results, so keep that order.

`extra-first-launch.png` shows the first-launch screen asking for a key. Swap it in for one of the five if you prefer.

The meal photos come from Unsplash under its free license. See [`screenshots/CREDITS.md`](screenshots/CREDITS.md). The meals and numbers are sample data loaded straight into the simulator app's storage, not live AI results.

To retake them later, run the app on the iPhone 18 Pro Max simulator, set the status bar with `xcrun simctl status_bar booted override --time 9:41 --batteryState discharging --batteryLevel 100`, and save each screen with `xcrun simctl io booted screenshot <file>.png`. Save the files outside the project folder while Metro is running. A new file in the project makes Metro reload the app mid-capture.

## iPhone Duo

Apple accepts iPhone Duo-optimized builds from October 5, 2026. A build is optimized when it's made with Xcode 27.1 (the iOS 27.1 SDK) or later. Older builds run in a smaller window on the inner display.

What the app does on iPhone Duo:

- **Outer display:** the status bar and camera sit on the right edge, and the tab bar runs vertically below them. Content stays clear of both.
- **Inner display:** the app fills the screen. Content is centered with a maximum width of 800 points, and the tab bar runs vertically on the right.
- **Fold, unfold and rotate:** the layout adapts without restarting. Text fields keep what's typed through a rotation. A fold with text typed hasn't been tested yet.
- **Cold launch while unfolded:** `patches/react-native-screens+4.30.0.patch` makes the tab bar appear. Without it, the tab bar is missing until the device folds or rotates. See the main README.

Say "iPhone Duo" in the promotional text and What's New, as above. Owners search for it, and Duo trackers read release notes.

### iPhone Duo screenshots

When you upload iPhone Duo screenshots, the App Store shows a badge on the product page saying the app is optimized for iPhone Duo. From April 2027, every submission must include them. Check App Store Connect's screenshot specifications for the iPhone Duo sizes.

To capture them, run the app on the iPhone Duo simulator (Xcode 27.1, iOS 27.1 runtime). Unfold it in Device Hub, load the same sample data as the iPhone screenshots, and save each screen with `xcrun simctl io <device> screenshot <file>.png`.

## After approval

- Choose **Manually release this version** on the version page if you want to pick the launch day.
- Delete the App Review Gemini key in Google AI Studio.
- For each update, bump `version` in `app.json`. EAS increments the build number automatically.
