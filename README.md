# Upkeep

Home and vehicle maintenance reminders for iPhone and Android. One codebase, built with Expo (React Native) and TypeScript.

"Upkeep" is a working name. Check both app stores for conflicts before you commit to it.

## What it does

- Add a home or a vehicle and get a starter schedule you can trim before saving
- Tasks repeat by months, by miles or both. Whichever comes first makes it due
- Due tab sorts everything into Overdue, Due soon, Not logged yet and Later
- One tap to mark a task done, or open it to log a past date, mileage, cost and a note
- History per task and money spent this year per home or vehicle
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
npm test            # due date and mileage logic
```

## Project layout

```
src/app/            screens (Expo Router, file based)
  (tabs)/           Due, My stuff, Settings
  asset/            add and view a home or vehicle
  task/             add and view a task
src/components/     shared UI
src/lib/
  due.ts            due date and mileage math (pure, tested)
  presets.ts        starter schedules. Edit these freely
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

## Known limits

- Mileage tasks cannot fire a notification on their own because the app does not know the odometer until you update it. They show as due in the app once mileage is entered.
- No backup or sync. Deleting the app deletes the data.
- Starter intervals are general rules of thumb, not manufacturer specs.
