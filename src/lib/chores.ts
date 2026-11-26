import { addDays, diffDays, formatDate } from './due';
import type { Chore, ChoreLog, Member } from './types';

/**
 * Household chores on one shared phone. The owner sets up people and chores.
 * Everyone else can check chores off. A PIN keeps kids from changing the list.
 */
export const ROLES: { key: Member['role']; label: string; about: string }[] = [
  { key: 'owner', label: 'Owner', about: 'Can add people and chores and change anything' },
  { key: 'adult', label: 'Adult', about: 'Checks off chores' },
  { key: 'roommate', label: 'Roommate', about: 'Checks off chores' },
  { key: 'kid', label: 'Kid', about: 'Checks off chores and earns stars' },
];

export function roleLabel(role: Member['role']): string {
  return ROLES.find((r) => r.key === role)?.label ?? 'Member';
}

export const MEMBER_COLORS: { key: string; hex: string }[] = [
  { key: 'green', hex: '#1F8A63' },
  { key: 'blue', hex: '#2D7FD3' },
  { key: 'purple', hex: '#7B56D6' },
  { key: 'orange', hex: '#E07B1F' },
  { key: 'red', hex: '#D64545' },
  { key: 'teal', hex: '#176B7A' },
  { key: 'pink', hex: '#C9418B' },
  { key: 'gold', hex: '#B8860B' },
];

export function memberHex(color: string): string {
  return MEMBER_COLORS.find((c) => c.key === color)?.hex ?? MEMBER_COLORS[0].hex;
}

/** The next color nobody is using yet. */
export function nextColor(members: Pick<Member, 'color'>[]): string {
  const used = new Set(members.map((m) => m.color));
  return (MEMBER_COLORS.find((c) => !used.has(c.key)) ?? MEMBER_COLORS[members.length % MEMBER_COLORS.length]).key;
}

export const REPEATS: { days?: number; label: string }[] = [
  { days: undefined, label: 'Just once' },
  { days: 1, label: 'Every day' },
  { days: 2, label: 'Every 2 days' },
  { days: 7, label: 'Every week' },
  { days: 14, label: 'Every 2 weeks' },
  { days: 30, label: 'Every month' },
];

export function repeatLabel(days?: number): string {
  return REPEATS.find((r) => r.days === days)?.label ?? `Every ${days} days`;
}

/** Ideas to get a household started. */
export const CHORE_IDEAS: { title: string; everyDays?: number }[] = [
  { title: 'Take out the trash', everyDays: 7 },
  { title: 'Load or empty the dishwasher', everyDays: 1 },
  { title: 'Feed the dogs', everyDays: 1 },
  { title: 'Clean your room', everyDays: 7 },
  { title: 'Vacuum the living room', everyDays: 7 },
  { title: 'Clean the bathroom', everyDays: 7 },
  { title: 'Water the plants', everyDays: 2 },
  { title: 'Wipe down the kitchen', everyDays: 1 },
  { title: 'Do your laundry', everyDays: 7 },
  { title: 'Mow the lawn', everyDays: 14 },
  { title: 'Clean the fish tank glass', everyDays: 7 },
  { title: 'Scoop the yard', everyDays: 7 },
];

export type ChoreStatus = 'overdue' | 'today' | 'upcoming' | 'done';

export type ChoreDue = {
  status: ChoreStatus;
  /** When it is next due. Blank for a one time chore that is done. */
  dueDate?: string;
  lastDone?: ChoreLog;
  label: string;
  /** Lower sorts first. */
  rank: number;
};

export function lastChoreLog(logs: ChoreLog[], choreId: string): ChoreLog | undefined {
  let best: ChoreLog | undefined;
  for (const l of logs) if (l.choreId === choreId && (!best || l.doneAt >= best.doneAt)) best = l;
  return best;
}

export function choreDue(chore: Chore, logs: ChoreLog[], today: string): ChoreDue {
  const lastDone = lastChoreLog(logs, chore.id);
  if (!chore.everyDays && lastDone) {
    return { status: 'done', lastDone, label: `Done ${lastDone.doneAt === today ? 'today' : formatDate(lastDone.doneAt)}`, rank: 10000 };
  }
  const due = lastDone && chore.everyDays ? addDays(lastDone.doneAt, chore.everyDays) : chore.startAt;
  const days = diffDays(today, due);
  if (lastDone?.doneAt === today) {
    return { status: 'done', dueDate: due, lastDone, label: `Done today. Next ${days === 1 ? 'tomorrow' : formatDate(due)}`, rank: 5000 + days };
  }
  if (days < 0) {
    const late = -days;
    return { status: 'overdue', dueDate: due, lastDone, label: late === 1 ? 'Was due yesterday' : `${late} days late`, rank: days };
  }
  if (days === 0) return { status: 'today', dueDate: due, lastDone, label: 'Due today', rank: 0 };
  return { status: 'upcoming', dueDate: due, lastDone, label: days === 1 ? 'Due tomorrow' : `Due ${formatDate(due)}`, rank: days };
}

/** Monday of the week the date falls in. */
export function weekStart(today: string): string {
  const [y, m, d] = today.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return addDays(today, -((day + 6) % 7));
}

/** Chores each person has done since Monday. One star each. */
export function starsThisWeek(logs: ChoreLog[], today: string): Map<string, number> {
  const from = weekStart(today);
  const out = new Map<string, number>();
  for (const l of logs) {
    if (!l.memberId || l.doneAt < from || l.doneAt > today) continue;
    out.set(l.memberId, (out.get(l.memberId) ?? 0) + 1);
  }
  return out;
}

/** Four digits only. */
export function validPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
