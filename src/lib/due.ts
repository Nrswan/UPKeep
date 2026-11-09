import type { Asset, DueInfo, LogEntry, Task } from './types';

/** Miles left at which a mileage task counts as due soon. */
export const SOON_MILES = 500;
/** Rough daily driving used only to sort mileage tasks against date tasks. */
const MILES_PER_DAY = 33;

const pad = (n: number) => String(n).padStart(2, '0');

/** Dates are stored as local YYYY-MM-DD strings so time zones never shift a due date. */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, days: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/** Adds months and clamps to the last day of the month (Jan 31 + 1 month = Feb 28). */
export function addMonths(s: string, months: number): string {
  const [y, m, d] = s.split('-').map(Number);
  const first = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return toDateStr(new Date(first.getFullYear(), first.getMonth(), Math.min(d, lastDay)));
}

export function diffDays(from: string, to: string): number {
  const a = parseDate(from);
  const b = parseDate(to);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

export function formatDate(s: string): string {
  return parseDate(s).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function latestLog(logs: LogEntry[], taskId: string): LogEntry | undefined {
  let best: LogEntry | undefined;
  for (const l of logs) {
    if (l.taskId !== taskId) continue;
    if (!best || l.doneAt > best.doneAt || (l.doneAt === best.doneAt && (l.miles ?? 0) > (best.miles ?? 0))) {
      best = l;
    }
  }
  return best;
}

function daysLabel(days: number): string {
  if (days < 0) {
    const n = -days;
    return n === 1 ? 'Overdue by 1 day' : n > 60 ? `Overdue by ${Math.round(n / 30)} months` : `Overdue by ${n} days`;
  }
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 60) return `Due in ${Math.round(days / 30)} months`;
  return `Due in ${days} days`;
}

function milesLabel(miles: number): string {
  const n = Math.abs(miles).toLocaleString();
  return miles <= 0 ? (miles === 0 ? 'Due now by mileage' : `Overdue by ${n} mi`) : `Due in ${n} mi`;
}

/**
 * Works out when a task is next due. Date and mileage are both checked and
 * whichever comes first wins.
 */
export function computeDue(
  task: Task,
  last: LogEntry | undefined,
  asset: Asset | undefined,
  today: string,
  leadDays: number
): DueInfo {
  const baseDate = last?.doneAt ?? task.startAt;
  const baseMiles = last ? last.miles : task.startMiles;

  let dueDate: string | undefined;
  let daysLeft: number | undefined;
  if (task.everyMonths && task.everyMonths > 0) {
    dueDate = addMonths(baseDate, task.everyMonths);
    daysLeft = diffDays(today, dueDate);
  }

  let dueMiles: number | undefined;
  let milesLeft: number | undefined;
  if (task.everyMiles && task.everyMiles > 0 && baseMiles != null && asset?.mileage != null) {
    dueMiles = baseMiles + task.everyMiles;
    milesLeft = dueMiles - asset.mileage;
  }

  const dateOver = daysLeft != null && daysLeft < 0;
  const milesOver = milesLeft != null && milesLeft <= 0;
  const dateSoon = daysLeft != null && daysLeft <= leadDays;
  const milesSoon = milesLeft != null && milesLeft <= SOON_MILES;

  let status: DueInfo['status'];
  if (dateOver || milesOver) status = 'overdue';
  else if (dateSoon || milesSoon) status = 'soon';
  else if (!last) status = 'unlogged';
  else status = 'ok';

  // Compare the two on one scale so the more urgent one drives sorting and the label.
  const milesAsDays = milesLeft != null ? milesLeft / MILES_PER_DAY : undefined;
  const urgency = Math.min(daysLeft ?? Infinity, milesAsDays ?? Infinity);
  const milesLeads = milesAsDays != null && milesAsDays < (daysLeft ?? Infinity);

  let label: string;
  if (daysLeft == null && milesLeft == null) {
    label = task.everyMiles ? 'Add mileage to track this' : 'No schedule set';
  } else if (milesLeads) {
    label = milesLabel(milesLeft!);
  } else {
    label = daysLabel(daysLeft!);
  }

  const order = { overdue: 0, soon: 1, unlogged: 2, ok: 3 }[status];
  const rank = order * 100000 + (Number.isFinite(urgency) ? urgency : 50000);

  return { status, dueDate, dueMiles, daysLeft, milesLeft, label, rank };
}

export function describeInterval(task: Pick<Task, 'everyMonths' | 'everyMiles'>): string {
  const parts: string[] = [];
  if (task.everyMonths) {
    const m = task.everyMonths;
    parts.push(m === 1 ? 'every month' : m % 12 === 0 ? (m === 12 ? 'every year' : `every ${m / 12} years`) : `every ${m} months`);
  }
  if (task.everyMiles) parts.push(`every ${task.everyMiles.toLocaleString()} mi`);
  if (!parts.length) return 'No schedule';
  const s = parts.join(' or ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
