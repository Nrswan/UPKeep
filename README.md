# Your Home-E

Home and vehicle maintenance reminders for iPhone and Android. One codebase, built with Expo (React Native) and TypeScript.

Your Home-E is your homie for keeping the house and the car in shape. Home-E is the dog on the home screen. The name lives in `src/lib/brand.ts`. Note that "HOMEE" is a registered trademark of Homee, Inc. for home services software, so get a trademark check before launch.

## What it does

- Add a home or a vehicle and get a starter schedule you can trim before saving
- Tasks repeat by months, by miles or both. Whichever comes first makes it due
- Due tab sorts everything into Overdue, Due soon, Not logged yet and Later
- One tap to mark a task done, or open it to log a past date, mileage, cost and a note
- History per task and money spent this year per home or vehicle
- Year, make and model dropdowns for vehicles. Models come live from NHTSA's free vPIC service, with type-your-own as the fallback
- A home screen with Home-E the dog, whose face changes with how things are going, plus a home health score, levels for logging jobs, quick tiles and a daily tip
- Who to call on every job that has a matching trade: the kind of pro, your saved pros first, a Google search for new ones and what to look for when hiring
- Things I buy: the products each home or vehicle uses, like paint colors with code and sheen, bulbs, flooring, filters and tires, with store, price, photos, search and a Buy it again search
- Hand off to the next owner: export one home or vehicle with its history, appliances, products, projects and the pros who worked on it. Costs are optional and tenant details are never included. The buyer imports it from Settings
- Pros tab: save the pros you trust with rating, phone, email and website, plus every job they did with receipts and photos. Logged upkeep can record which pro did it
- Step by step setup for homes and vehicles, one question per screen. Every appliance needs an answer, and "I'm not sure" comes with a how to tell guide
- Home appliances by type: swamp cooler or refrigerated air, gas or electric range, dryer and water heater, plus more. Each type adds its own upkeep tasks and holds brand, model, serial number and photos
- Parts and specs on any task, such as oil weight and filter number. They prefill when you log the job and each log keeps what was used
- DIY Tracker on each home: projects by room, expenses by category such as floors, paint or vanity, receipt photos, a budget and before and after pictures
- A plain "why it matters" note and a difficulty and time guide on every starter task, including when to call a pro
- A "good to know" card on each home and vehicle for shutoff locations, breaker panel, tire size and similar facts
- A getting started checklist on the dashboard for new users
- Backup and restore from Settings. One file holds all records and, if chosen, the photos
- A PDF maintenance record for any home or vehicle: details, appliances, service history, projects, spending by year and warranties
- Seasonal checklists for spring, summer, fall and winter that fit the appliances and vehicles the user has
- Safety recall lookup for vehicles from NHTSA's free public API
- Rental properties: flag a home as a rental to add tenant and lease facts and mark it on lists and reports
- Edit screen for homes and vehicles
- A test reminder button in Settings
- A safety notice and disclaimer that every user must agree to on first launch. It is also in Settings and linked from each task
- A "Tip the developer" card in Settings. Links are set in `src/lib/tip.ts`
- Warranties tab for things you bought: purchase date, length, price, store and a reminder 30 days before coverage ends
- Photos from the camera or library on homes, vehicles, warranty items and service logs
- Local reminders at 9 AM with a heads-up window you pick in Settings
- Light and dark mode
- No account and no server. Data stays on the phone

## Run it

You need Node 20 or newer. The tests need Node 22.18 or newer.

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
  identify.ts       setup questions and how to tell gas from electric and similar
  specs.ts          suggested parts and specs fields per task
  why.ts            why each job matters
  effort.ts         difficulty and time guide per job
  diy.ts            DIY rooms, categories and totals
  tip.ts            developer name and tip links
  legal.ts          safety notice and disclaimer text
  backup.ts         backup file format, building and checking (pure, tested)
  transfer.ts       hand off files for a new owner (pure, tested)
  purchases.ts      product kinds and the details saved for each
  report.ts         the printable maintenance record (pure, tested)
  io.ts             file sharing for backups and PDF reports
  seasons.ts        seasonal checklist items
  contacts.ts       trades, which jobs they cover, Google searches and hiring tips
  fun.ts            greeting, home health score, levels and daily tips
  brand.ts          the app name
  recalls.ts        NHTSA recall lookup
  store.ts          app data, saved to the phone with AsyncStorage
  reminders.ts      local notification scheduling
  theme.ts          colors
tests/              unit tests for due.ts
```

## Before you publish

1. Change `com.yourname.upkeep` in `app.json` (both `ios.bundleIdentifier` and `android.package`). This cannot be changed after release.
2. The icon in `assets/` is a first pass. Replace it if you want a different look.
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
- No automatic sync. Data stays on the phone unless the user makes a backup file from Settings. Backup files are not encrypted.
- Recall results cover a year, make and model in general. Only a VIN check at nhtsa.gov shows whether one vehicle is affected.
- Seasonal checklists follow the Northern Hemisphere calendar.
- Starter intervals are general rules of thumb, not manufacturer specs. Picking a year, make and model does not load that vehicle's factory schedule. That data is only sold through paid providers, so it needs a paid API and a small server to hold the key.
- Photos live in the app's own storage on the phone. They are not added to the camera roll and are removed if the app is deleted.
