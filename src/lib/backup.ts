import type {
  Appliance,
  Asset,
  Contact,
  ProJob,
  Purchase,
  Expense,
  LogEntry,
  Project,
  Settings,
  Task,
  WarrantyItem,
} from './types';
import { APP_NAME } from './brand';

/** Everything the app saves. This is also the shape of a backup file's data. */
export type BackupData = {
  assets: Asset[];
  tasks: Task[];
  logs: LogEntry[];
  warranties: WarrantyItem[];
  appliances: Appliance[];
  projects: Project[];
  expenses: Expense[];
  contacts: Contact[];
  proJobs: ProJob[];
  purchases: Purchase[];
  seasonChecks: Record<string, string[]>;
  settings: Settings;
};

export const BACKUP_VERSION = 1;

const LISTS = ['assets', 'tasks', 'logs', 'warranties', 'appliances', 'projects', 'expenses', 'contacts', 'proJobs', 'purchases'] as const;

type BackupFile = {
  app: 'upkeep';
  version: number;
  exportedAt: string;
  data: BackupData;
  /** Photo file name to base64 content. Empty when photos were left out. */
  photos: Record<string, string>;
};

/** Picks just the saved parts out of the full app state. */
export function pickData(state: BackupData): BackupData {
  return {
    assets: state.assets,
    tasks: state.tasks,
    logs: state.logs,
    warranties: state.warranties,
    appliances: state.appliances,
    projects: state.projects,
    expenses: state.expenses,
    contacts: state.contacts,
    proJobs: state.proJobs,
    purchases: state.purchases,
    seasonChecks: state.seasonChecks,
    settings: state.settings,
  };
}

/** Every photo file name the data points to, without repeats. */
export function photoNames(
  data: Pick<BackupData, 'assets' | 'logs' | 'warranties' | 'appliances' | 'projects' | 'expenses'> & Partial<Pick<BackupData, 'proJobs' | 'purchases'>>
): string[] {
  const names = new Set<string>();
  const add = (n?: string) => {
    if (n) names.add(n);
  };
  data.assets.forEach((a) => add(a.photo));
  data.logs.forEach((l) => l.photos?.forEach(add));
  data.warranties.forEach((w) => w.photos.forEach(add));
  data.appliances.forEach((a) => a.photos.forEach(add));
  data.projects.forEach((p) => p.photos.forEach(add));
  data.expenses.forEach((e) => e.photos.forEach(add));
  data.proJobs?.forEach((j) => j.photos.forEach(add));
  data.purchases?.forEach((p) => p.photos.forEach(add));
  return [...names];
}

export function buildBackup(data: BackupData, photos: Record<string, string>, exportedAt: string): string {
  const file: BackupFile = { app: 'upkeep', version: BACKUP_VERSION, exportedAt, data: pickData(data), photos };
  return JSON.stringify(file);
}

export type ParsedBackup = { data: BackupData; photos: Record<string, string>; exportedAt: string };

/** Reads a backup file. Throws an Error with a message fit to show the user. */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`That file is not a backup from ${APP_NAME}.`);
  }
  const file = raw as Partial<BackupFile> | null;
  if (!file || typeof file !== 'object' || file.app !== 'upkeep' || !file.data || typeof file.data !== 'object') {
    throw new Error(`That file is not a backup from ${APP_NAME}.`);
  }
  if ((file as { kind?: unknown }).kind === 'transfer') {
    throw new Error('That is a transfer file for one home or vehicle. Use "Import from a previous owner" instead.');
  }
  if (typeof file.version !== 'number' || file.version > BACKUP_VERSION) {
    throw new Error(`This backup was made by a newer version of ${APP_NAME}. Update the app and try again.`);
  }

  const d = file.data as Partial<BackupData>;
  const data = cleanLists(d) as BackupData;
  data.seasonChecks = d.seasonChecks && typeof d.seasonChecks === 'object' && !Array.isArray(d.seasonChecks) ? d.seasonChecks : {};
  const s = (d.settings ?? {}) as Partial<Settings>;
  data.settings = {
    ...s,
    remindersOn: typeof s.remindersOn === 'boolean' ? s.remindersOn : true,
    leadDays: typeof s.leadDays === 'number' ? s.leadDays : 7,
  };

  return { data, photos: cleanPhotos(file.photos), exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : '' };
}

/** Keeps only well formed records in each list. Missing lists come back empty. */
export function cleanLists(d: Partial<Record<(typeof LISTS)[number], unknown>>): Pick<BackupData, (typeof LISTS)[number]> {
  const data = {} as Pick<BackupData, (typeof LISTS)[number]>;
  for (const key of LISTS) {
    const list = d[key];
    if (list != null && !Array.isArray(list)) throw new Error('That file is damaged.');
    // Older files may not have every list.
    (data[key] as unknown[]) = ((list as unknown[] | undefined) ?? []).filter(
      (x) => x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string'
    );
  }
  return data;
}

/** Photo file names only. Anything with a path in it is dropped. */
export function cleanPhotos(raw: unknown): Record<string, string> {
  const photos: Record<string, string> = {};
  if (raw && typeof raw === 'object') {
    for (const [name, content] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof content === 'string' && /^[\w.-]+$/.test(name)) photos[name] = content;
    }
  }
  return photos;
}

/** "3 homes and vehicles, 42 tasks, 17 log entries" for the restore prompt. */
export function describeBackup(data: BackupData): string {
  const part = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return [
    part(data.assets.length, 'home or vehicle', 'homes and vehicles'),
    part(data.tasks.length, 'task', 'tasks'),
    part(data.logs.length, 'log entry', 'log entries'),
    part(data.warranties.length, 'warranty', 'warranties'),
    part(data.projects.length, 'project', 'projects'),
  ].join(', ');
}
