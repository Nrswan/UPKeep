import { useMemo } from 'react';

import { todayStr } from './due';
import { itemsFor, type SeasonContext, seasonForMonth, seasonKey, SEASONS } from './seasons';
import { useStore } from './store';

/** What the user has, used to pick which seasonal items apply. */
export function useSeasonContext(): SeasonContext {
  const assets = useStore((s) => s.assets);
  const appliances = useStore((s) => s.appliances);
  return useMemo(
    () => ({
      hasVehicle: assets.some((a) => a.kind === 'vehicle'),
      appliances: new Set(appliances.map((a) => `${a.category}:${a.option}`)),
    }),
    [assets, appliances]
  );
}

/** Progress on the current season's checklist, for the dashboard. */
export function useCurrentSeason() {
  const ctx = useSeasonContext();
  const checks = useStore((s) => s.seasonChecks);
  const today = todayStr();
  const season = seasonForMonth(Number(today.slice(5, 7)));
  const def = SEASONS.find((s) => s.key === season)!;
  const items = itemsFor(season, ctx);
  const done = new Set(checks[seasonKey(today)] ?? []);
  return { def, total: items.length, done: items.filter((i) => done.has(i.id)).length };
}
