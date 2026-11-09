import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { addDays, computeDue, latestLog, parseDate, todayStr } from './due';
import type { Asset, LogEntry, Settings, Task } from './types';

/** iOS keeps at most 64 pending local notifications per app. */
const MAX_SCHEDULED = 60;
const REMIND_HOUR = 9;

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

export function setupNotifications() {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('reminders', {
      name: 'Maintenance reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => {});
  }
}

export async function ensurePermission(): Promise<boolean> {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

type Snapshot = { assets: Asset[]; tasks: Task[]; logs: LogEntry[]; settings: Settings };

export type PlannedReminder = { at: Date; title: string; body: string };

/** Pure planning step, kept separate from the native calls so it can be tested. */
export function planReminders(snap: Snapshot, now: Date = new Date()): PlannedReminder[] {
  const today = todayStr();
  const assetById = new Map(snap.assets.map((a) => [a.id, a]));
  const planned: PlannedReminder[] = [];
  let overdue = 0;

  for (const task of snap.tasks) {
    const asset = assetById.get(task.assetId);
    if (!asset) continue;
    const due = computeDue(task, latestLog(snap.logs, task.id), asset, today, snap.settings.leadDays);
    if (due.status === 'overdue') {
      overdue++;
      continue;
    }
    if (!due.dueDate) continue;

    const at = parseDate(addDays(due.dueDate, -snap.settings.leadDays));
    at.setHours(REMIND_HOUR, 0, 0, 0);
    if (at.getTime() <= now.getTime()) {
      // The heads-up window already started. Fall back to the due date itself.
      const onDay = parseDate(due.dueDate);
      onDay.setHours(REMIND_HOUR, 0, 0, 0);
      if (onDay.getTime() <= now.getTime()) continue;
      planned.push({ at: onDay, title: `${task.title} is due today`, body: asset.name });
    } else {
      const lead = snap.settings.leadDays;
      const when = lead === 0 ? 'today' : lead === 1 ? 'tomorrow' : `in ${lead} days`;
      planned.push({ at, title: `${task.title} is due ${when}`, body: asset.name });
    }
  }

  planned.sort((a, b) => a.at.getTime() - b.at.getTime());
  const out = planned.slice(0, MAX_SCHEDULED - 1);

  // One quiet nudge for overdue work instead of an alert per task. Opening the
  // app reschedules it, so it only fires if the list has been ignored for 3 days.
  if (overdue > 0) {
    const at = parseDate(addDays(today, 3));
    at.setHours(REMIND_HOUR, 0, 0, 0);
    out.push({
      at,
      title: overdue === 1 ? '1 task is overdue' : `${overdue} tasks are overdue`,
      body: 'Open Upkeep to check them off.',
    });
  }
  return out;
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Rebuilds every scheduled reminder from current data. Debounced. */
export function syncReminders(snap: Snapshot) {
  if (!supported) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    run(snap).catch(() => {});
  }, 800);
}

async function run(snap: Snapshot) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!snap.settings.remindersOn || snap.tasks.length === 0) return;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;

  for (const r of planReminders(snap)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: r.at,
        channelId: 'reminders',
      },
    });
  }
}
