# Upkeep

Home and vehicle maintenance reminders for iPhone and Android. One codebase, built with Expo (React Native) and TypeScript.

"Upkeep" is a working name. Check both app stores for conflicts before you commit to it.

## What it does

- Add a home or a vehicle and get a starter schedule you can trim before saving
- Tasks repeat by months, by miles or both. Whichever comes first makes it due
- Due tab sorts everything into Overdue, Due soon, Not logged yet and Later
- One tap to mark a task done, or open it to log a past date, mileage, cost and a note
- History per task and money spent this year per home or vehicle
- Year, make and model dropdowns for vehicles. Models come live from NHTSA's free vPIC service, with type-your-own as the fallback
- Home appliances by type: swamp cooler or refrigerated air, gas or electric range, dryer and water heater, plus more. Each type adds its own upkeep tasks and holds brand, model, serial number and photos
- Parts and specs on any task, such as oil weight and filter number. They prefill when you log the job and each log keeps what was used
- DIY Tracker on each home: projects by room, expenses by category such as floors, paint or vanity, receipt photos, a budget and before and after pictures
- A plain "why it matters" note and a difficulty and time guide on every starter task, including when to call a pro
- A "good to know" card on each home and vehicle for shutoff locations, breaker panel, tire size and similar facts
- A getting started checklist on the dashboard for new users
- A safety notice and disclaimer that every user must agree to on first launch. It is also in Settings and linked from each task
- A "Tip the developer" card in Settings. Links are set in `src/lib/tip.ts`
- Warranties tab for things you bought: purchase date, length, price, store and a reminder 30 days before coverage ends
- Photos from the camera or library on homes, vehicles, warranty items and service logs
- Local reminders at 9 AM with a heads-up window you pick in Settings
- Light and dark mode
- No account and no server. Data stays on the phone

## Run it

You need Node 20 or newer.

```bash
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your phone. Press `w` in the terminal to open it in a browser instead.

## Check it

```bash
npm run typecheck   # TypeScript
npm test            # due dates, warranties, specs, DIY totals and task guides
```

## Project layout

```
src/app/            screens (Expo Router, file based)
  (tabs)/           Due, My stuff, Settings
  asset/            add and view a home or vehicle
  task/             add and view a task
src/components/     shared UI
src/lib/
  due.ts            due date, mileage and warranty math (pure, tested)
  photos.ts         camera, library and saved photo files
  vehicles.ts       year and make lists, live model lookup
  taskIcon.ts       icon and color for each kind of task
  presets.ts        starter schedules. Edit these freely
  appliances.ts     appliance types and the upkeep each one needs
  specs.ts          suggested parts and specs fields per task
  why.ts            why each job matters
  effort.ts         difficulty and time guide per job
  diy.ts            DIY rooms, categories and totals
  tip.ts            developer name and tip links
  legal.ts          safety notice and disclaimer text
  store.ts          app data, saved to the phone with AsyncStorage
  reminders.ts      local notification scheduling
  theme.ts          colors
tests/              unit tests for due.ts
```

## Before you publish

1. Change `com.yourname.upkeep` in `app.json` (both `ios.bundleIdentifier` and `android.package`). This cannot be changed after release.
2. Replace the placeholder icon and splash images in `assets/`.
3. Create an Apple Developer account and a Google Play Console account.
4. Build and submit with EAS:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform all
npx eas-cli@latest submit --platform all
```

5. Set the price in App Store Connect and Play Console. A paid download needs no purchase code in the app.
6. Both stores ask for a privacy policy URL. This app collects nothing, so the policy can be short.

## Disclaimer

The wording lives in `src/lib/legal.ts`. It is a plain language starting point and has not been reviewed by an attorney. Have one review it before release. Raise `DISCLAIMER_VERSION` when the text changes and every user is asked to agree again. The same text should also go in the App Store and Google Play listings as the app's terms of use.

## Tip links

`src/lib/tip.ts` holds the developer name and an empty list of tip links. Check the current App Store and Google Play payment rules before adding outside links such as Venmo or PayPal. Apple has rejected apps for outside tip links and expects developer tips to go through in-app purchase.

## Known limits

- Mileage tasks cannot fire a notification on their own because the app does not know the odometer until you update it. They show as due in the app once mileage is entered.
- No backup or sync. Deleting the app deletes the data.
- Starter intervals are general rules of thumb, not manufacturer specs. Picking a year, make and model does not load that vehicle's factory schedule. That data is only sold through paid providers, so it needs a paid API and a small server to hold the key.
- Photos live in the app's own storage on the phone. They are not added to the camera roll and are removed if the app is deleted.
