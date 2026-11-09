/**
 * How hard a job is and roughly how long it takes, for people who have not
 * done it before. Matched on the task title, first match wins.
 *
 * These are general guides. Times assume you have the parts on hand.
 */
export type EffortLevel = 'easy' | 'moderate' | 'pro';
export type Effort = { level: EffortLevel; minutes?: number; tip?: string };

const RULES: [RegExp, Effort][] = [
  // Vehicles
  [/\boil\b/i, { level: 'moderate', minutes: 45, tip: 'Not up for it? A quick lube shop does this while you wait.' }],
  [/tire pressure/i, { level: 'easy', minutes: 5, tip: 'The right pressure is on the sticker inside the driver door, not on the tire.' }],
  [/rotate tires/i, { level: 'moderate', minutes: 45, tip: 'Many tire shops rotate for free if you bought the tires there.' }],
  [/engine air filter/i, { level: 'easy', minutes: 10 }],
  [/cabin air filter/i, { level: 'easy', minutes: 15, tip: 'It is usually behind the glove box.' }],
  [/brake fluid/i, { level: 'pro' }],
  [/brake/i, { level: 'pro', tip: 'Most shops check brakes during a tire rotation.' }],
  [/wiper/i, { level: 'easy', minutes: 10 }],
  [/test battery/i, { level: 'easy', minutes: 15, tip: 'Most auto parts stores test batteries for free.' }],
  [/transmission/i, { level: 'pro' }],
  [/coolant/i, { level: 'pro' }],
  [/registration/i, { level: 'easy', minutes: 10 }],

  // Safety around the house
  [/alarm batter/i, { level: 'easy', minutes: 15 }],
  [/smoke|co alarm/i, { level: 'easy', minutes: 5 }],
  [/extinguisher/i, { level: 'easy', minutes: 2 }],
  [/gas line/i, { level: 'easy', minutes: 5, tip: 'Looking is the whole job. Call a pro for any repair.' }],
  [/burner and vent/i, { level: 'pro' }],
  [/gas furnace/i, { level: 'pro' }],

  // Cooling and heating
  [/cooler pad/i, { level: 'moderate', minutes: 45, tip: 'Rooftop cooler? Use a pro if you are not comfortable up there.' }],
  [/winterize/i, { level: 'moderate', minutes: 30 }],
  [/start up swamp/i, { level: 'moderate', minutes: 60 }],
  [/condenser/i, { level: 'easy', minutes: 30, tip: 'Turn the power off at the disconnect first, then rinse gently with a garden hose.' }],
  [/condensate/i, { level: 'easy', minutes: 15 }],
  [/deep clean mini split/i, { level: 'pro' }],
  [/mini split filter|furnace filter|air filter/i, { level: 'easy', minutes: 5, tip: 'The size is printed on the edge of the old filter.' }],
  [/tune-up|inspection/i, { level: 'pro' }],
  [/heat pump/i, { level: 'easy', minutes: 10 }],

  // Kitchen and laundry
  [/hood filter/i, { level: 'easy', minutes: 15 }],
  [/burner port|igniter/i, { level: 'easy', minutes: 20 }],
  [/drip pan|element/i, { level: 'easy', minutes: 15 }],
  [/refrigerator coil/i, { level: 'easy', minutes: 20 }],
  [/water filter/i, { level: 'easy', minutes: 5 }],
  [/dishwasher/i, { level: 'easy', minutes: 10 }],
  [/dryer vent/i, { level: 'moderate', minutes: 45, tip: 'A vent cleaning kit that attaches to a drill makes this much easier.' }],
  [/lint/i, { level: 'easy', minutes: 10 }],
  [/washer hose/i, { level: 'easy', minutes: 5 }],
  [/washer/i, { level: 'easy', minutes: 5 }],

  // Water
  [/relief valve/i, { level: 'easy', minutes: 5 }],
  [/anode/i, { level: 'moderate', minutes: 60, tip: 'A stuck rod can be stubborn. A plumber can do this during a flush.' }],
  [/descale/i, { level: 'moderate', minutes: 60 }],
  [/inlet filter/i, { level: 'easy', minutes: 15 }],
  [/water heater/i, { level: 'moderate', minutes: 45 }],
  [/softener/i, { level: 'easy', minutes: 5 }],

  // House
  [/gutter/i, { level: 'moderate', minutes: 60, tip: 'Ladder work. Have someone hold it, or hire it out for a two story home.' }],
  [/roof/i, { level: 'easy', minutes: 15, tip: 'Look from the ground with binoculars. Leave walking on the roof to a pro.' }],
  [/caulk/i, { level: 'easy', minutes: 30 }],
  [/leak|under sink/i, { level: 'easy', minutes: 5 }],
];

export function effortFor(title: string): Effort | undefined {
  for (const [re, effort] of RULES) if (re.test(title)) return effort;
  return undefined;
}

const LEVEL_TEXT: Record<EffortLevel, string> = {
  easy: 'Easy to do yourself',
  moderate: 'Doable with some care',
  pro: 'Best left to a pro',
};

/** "Easy to do yourself  ·  about 10 min" */
export function effortLabel(e: Effort): string {
  if (e.minutes == null) return LEVEL_TEXT[e.level];
  const time = e.minutes >= 60 ? (e.minutes === 60 ? 'about 1 hour' : `about ${Math.round(e.minutes / 60)} hours`) : `about ${e.minutes} min`;
  return `${LEVEL_TEXT[e.level]}  ·  ${time}`;
}
