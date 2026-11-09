import { useMemo } from 'react';

import { computeDue, latestLog, todayStr } from './due';
import { useStore } from './store';
import type { Asset, DueInfo, Task } from './types';

export type DueItem = { task: Task; asset: Asset; due: DueInfo };

/** Every task with its due state, most urgent first. Pass an asset id to filter. */
export function useDueItems(assetId?: string): DueItem[] {
  const assets = useStore((s) => s.assets);
  const tasks = useStore((s) => s.tasks);
  const logs = useStore((s) => s.logs);
  const leadDays = useStore((s) => s.settings.leadDays);

  return useMemo(() => {
    const today = todayStr();
    const byId = new Map(assets.map((a) => [a.id, a]));
    const items: DueItem[] = [];
    for (const task of tasks) {
      if (assetId && task.assetId !== assetId) continue;
      const asset = byId.get(task.assetId);
      if (!asset) continue;
      items.push({ task, asset, due: computeDue(task, latestLog(logs, task.id), asset, today, leadDays) });
    }
    return items.sort((a, b) => a.due.rank - b.due.rank);
  }, [assets, tasks, logs, leadDays, assetId]);
}
