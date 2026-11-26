/**
 * The friendly bits on the home screen: greeting, home health score, a level
 * that grows as jobs get logged and a handy tip that changes every day.
 */
export function greeting(hour: number): string {
  if (hour < 4) return 'Up late?';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Share of tasks that are not overdue, 0 to 100. Due soon counts as half a
 * miss so the score starts to slide before things are actually late.
 */
export function healthScore(statuses: string[]): number {
  if (!statuses.length) return 100;
  const misses = statuses.reduce((n, s) => n + (s === 'overdue' ? 1 : s === 'soon' ? 0.5 : 0), 0);
  return Math.max(0, Math.round(100 * (1 - misses / statuses.length)));
}

export function healthLabel(score: number): string {
  if (score >= 90) return 'Great shape';
  if (score >= 75) return 'Doing well';
  if (score >= 50) return 'Needs some love';
  return 'Time to catch up';
}

const LEVELS = [
  { name: 'Rookie', at: 0 },
  { name: 'Handy', at: 5 },
  { name: 'Skilled', at: 15 },
  { name: 'Pro', at: 30 },
  { name: 'Master', at: 60 },
];

/** Level from the number of jobs logged, with progress toward the next one. */
export function level(jobs: number): { name: string; next?: string; toNext: number; progress: number } {
  let i = 0;
  while (i + 1 < LEVELS.length && jobs >= LEVELS[i + 1].at) i++;
  const cur = LEVELS[i];
  const nxt = LEVELS[i + 1];
  if (!nxt) return { name: cur.name, toNext: 0, progress: 1 };
  return { name: cur.name, next: nxt.name, toNext: nxt.at - jobs, progress: (jobs - cur.at) / (nxt.at - cur.at) };
}

export const TIPS: string[] = [
  'Write the date on each new air filter with a marker. Next time you will know exactly how long it has been in.',
  'Press TEST then RESET on the GFCI outlets in your kitchen and bathrooms every few months to make sure they still trip.',
  'Put a few drops of food coloring in the toilet tank. If color shows up in the bowl without a flush, the flapper is leaking.',
  'Tag your main water shutoff with a bright label so anyone in the house can find it fast.',
  'Clean the dryer lint screen every load. A clogged screen makes the dryer run longer and hotter.',
  'Snap a photo of the sticker on each appliance. It has the model and serial numbers you need for parts.',
  'The right tire pressure is on the sticker inside the driver door, not the number on the tire.',
  'Run the water and flush toilets in rooms you rarely use. It keeps drain traps full so sewer smells stay out.',
  'Vacuum the return air grilles and bathroom fan covers. Dust there cuts airflow.',
  'Keep a spare furnace filter on hand so changing it takes two minutes instead of a store trip.',
  'Let cooking grease cool and toss it in the trash instead of the sink. It is one of the top causes of clogged drains.',
  'Braided steel washer hoses are far less likely to burst than rubber ones.',
  'Tighten loose cabinet hinges and handles when you notice them, before the screw holes strip out.',
  'Check your oil on level ground with the engine off for an accurate reading.',
  'A squeal when you brake often means the pads are getting thin. Have them checked soon.',
  'Keep plants trimmed back from the house so moisture and pests stay off the walls.',
  'Keep receipts for big repairs and upgrades. They help at tax time and when you sell.',
  'In summer, set ceiling fans to spin counterclockwise so they push air down and you feel cooler.',
  'Look at the floor around your water heater now and then. Rust or water there is an early warning.',
  'Pour a bucket of water into floor drains and unused tubs once in a while so the trap does not dry out.',
  'Before a trip, shut off the water to the washing machine. A burst hose while you are away is costly.',
  'A dab of bar soap on a sticky wooden drawer runner makes it slide again.',
];

/** Same tip all day, a different one each day. */
export function tipOfDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const day = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
  return TIPS[(day + y) % TIPS.length];
}
