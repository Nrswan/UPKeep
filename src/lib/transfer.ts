import { type BackupData, cleanLists, cleanPhotos, photoNames } from './backup';
import { APP_NAME } from './brand';
import { dialable } from './contacts';
import { RENTAL_FACTS } from './specs';
import type { Asset, Contact } from './types';

/**
 * Handing a home or vehicle to its next owner. The seller exports one home or
 * vehicle with its history, appliances, products, projects and the pros who
 * worked on it. The buyer imports it into their own copy of the app.
 *
 * Nothing about the seller's other homes, vehicles or pros goes in the file,
 * and tenant details are never included.
 */
export const TRANSFER_VERSION = 1;

export type TransferOptions = {
  /** Prices, costs and amounts paid. Off keeps them private. */
  includeCosts: boolean;
  /** Warranties to pass along, such as ones on appliances that stay with the home. */
  warrantyIds: string[];
};

type Lists = Pick<
  BackupData,
  'assets' | 'tasks' | 'logs' | 'warranties' | 'appliances' | 'projects' | 'expenses' | 'contacts' | 'proJobs' | 'purchases'
>;

/** Picks out everything about one home or vehicle. */
export function selectTransfer(all: Lists, assetId: string, opts: TransferOptions): Lists {
  const asset = all.assets.find((a) => a.id === assetId);
  if (!asset) throw new Error('That home or vehicle was not found.');
  const cost = <T extends object>(o: T, ...keys: (keyof T)[]): T => {
    if (opts.includeCosts) return o;
    const copy = { ...o };
    for (const k of keys) delete copy[k];
    return copy;
  };

  const rental = new Set(RENTAL_FACTS.map((f) => f.toLowerCase()));
  const outAsset: Asset = { ...asset, rental: undefined, facts: asset.facts?.filter((f) => !rental.has(f.label.toLowerCase())) };

  const tasks = all.tasks.filter((t) => t.assetId === assetId);
  const logs = all.logs.filter((l) => l.assetId === assetId);
  const projects = all.projects.filter((p) => p.assetId === assetId);
  const projectIds = new Set(projects.map((p) => p.id));
  const proJobs = all.proJobs.filter((j) => j.assetId === assetId);

  // Only pros who actually worked on this home or vehicle.
  const proIds = new Set<string>([...proJobs.map((j) => j.contactId), ...logs.flatMap((l) => (l.contactId ? [l.contactId] : []))]);
  const contacts = all.contacts.filter((c) => proIds.has(c.id));

  return {
    assets: [outAsset],
    tasks,
    logs: logs.map((l) => cost(l, 'cost')),
    appliances: all.appliances.filter((a) => a.assetId === assetId),
    projects,
    // Project spending is all amounts, so it only goes along when costs do.
    expenses: opts.includeCosts ? all.expenses.filter((e) => projectIds.has(e.projectId)) : [],
    purchases: all.purchases.filter((p) => p.assetId === assetId).map((p) => cost(p, 'price')),
    proJobs: proJobs.map((j) => cost(j, 'cost')),
    contacts,
    warranties: all.warranties.filter((w) => opts.warrantyIds.includes(w.id)).map((w) => cost(w, 'price')),
  };
}

type TransferFile = { app: 'upkeep'; kind: 'transfer'; version: number; exportedAt: string; from: string; data: Lists; photos: Record<string, string> };

export function buildTransfer(data: Lists, photos: Record<string, string>, exportedAt: string): string {
  const file: TransferFile = { app: 'upkeep', kind: 'transfer', version: TRANSFER_VERSION, exportedAt, from: data.assets[0]?.name ?? '', data, photos };
  return JSON.stringify(file);
}

/** Photo names a transfer needs. */
export function transferPhotoNames(data: Lists): string[] {
  return photoNames(data);
}

export type ParsedTransfer = { data: Lists; photos: Record<string, string>; exportedAt: string; from: string };

/** Reads a transfer file. Throws an Error with a message fit to show the user. */
export function parseTransfer(text: string): ParsedTransfer {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`That file is not a transfer from ${APP_NAME}.`);
  }
  const file = raw as Partial<TransferFile> | null;
  if (!file || typeof file !== 'object' || file.app !== 'upkeep' || !file.data || typeof file.data !== 'object') {
    throw new Error(`That file is not a transfer from ${APP_NAME}.`);
  }
  if (file.kind !== 'transfer') {
    throw new Error('That is a full backup, not a transfer. Use "Restore from a backup" for your own backups.');
  }
  if (typeof file.version !== 'number' || file.version > TRANSFER_VERSION) {
    throw new Error(`This file was made by a newer version of ${APP_NAME}. Update the app and try again.`);
  }
  const data = cleanLists(file.data) as Lists;
  if (data.assets.length !== 1) throw new Error('That transfer file is damaged.');
  return {
    data,
    photos: cleanPhotos(file.photos),
    exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : '',
    from: typeof file.from === 'string' ? file.from : data.assets[0].name,
  };
}

/** "12 tasks, 30 log entries, 4 appliances, 2 pros" for the import prompt. */
export function describeTransfer(d: Lists): string {
  const part = (n: number, one: string, many: string) => (n ? `${n} ${n === 1 ? one : many}` : '');
  return [
    part(d.tasks.length, 'task', 'tasks'),
    part(d.logs.length, 'service record', 'service records'),
    part(d.appliances.length, 'appliance', 'appliances'),
    part(d.purchases.length, 'product', 'products'),
    part(d.projects.length, 'project', 'projects'),
    part(d.contacts.length, 'pro', 'pros'),
    part(d.warranties.length, 'warranty', 'warranties'),
  ]
    .filter(Boolean)
    .join(', ');
}

const samePro = (a: Contact, b: Contact) =>
  (!!a.phone && !!b.phone && dialable(a.phone) === dialable(b.phone)) || a.name.trim().toLowerCase() === b.name.trim().toLowerCase();

/**
 * Gives every incoming record a new id and points every link at the new ids,
 * so an import can never collide with the buyer's own records. Pros the buyer
 * already has are matched by phone or name instead of added twice.
 */
export function prepareImport(incoming: Lists, existingContacts: Contact[], newId: () => string): { data: Lists; prosMatched: number } {
  const map = new Map<string, string>();
  const fresh = (old: string) => {
    let id = map.get(old);
    if (!id) map.set(old, (id = newId()));
    return id;
  };
  const link = (old?: string) => (old ? map.get(old) : undefined);

  let prosMatched = 0;
  const contacts: Contact[] = [];
  for (const c of incoming.contacts) {
    const match = existingContacts.find((e) => samePro(e, c));
    if (match) {
      map.set(c.id, match.id);
      prosMatched++;
    } else {
      contacts.push({ ...c, id: fresh(c.id) });
    }
  }

  const assets = incoming.assets.map((a) => ({ ...a, id: fresh(a.id) }));
  const appliances = incoming.appliances.map((a) => ({ ...a, id: fresh(a.id), assetId: link(a.assetId)! }));
  const tasks = incoming.tasks.map((t) => ({ ...t, id: fresh(t.id), assetId: link(t.assetId)!, applianceId: link(t.applianceId) }));
  const projects = incoming.projects.map((p) => ({ ...p, id: fresh(p.id), assetId: link(p.assetId)! }));

  return {
    prosMatched,
    data: {
      assets,
      appliances,
      tasks,
      projects,
      contacts,
      logs: incoming.logs
        .filter((l) => map.has(l.taskId))
        .map((l) => ({ ...l, id: fresh(l.id), taskId: link(l.taskId)!, assetId: link(l.assetId)!, contactId: link(l.contactId) })),
      expenses: incoming.expenses.filter((e) => map.has(e.projectId)).map((e) => ({ ...e, id: fresh(e.id), projectId: link(e.projectId)! })),
      purchases: incoming.purchases.map((p) => ({ ...p, id: fresh(p.id), assetId: link(p.assetId)! })),
      proJobs: incoming.proJobs
        .filter((j) => map.has(j.contactId))
        .map((j) => ({ ...j, id: fresh(j.id), contactId: link(j.contactId)!, assetId: link(j.assetId) })),
      warranties: incoming.warranties.map((w) => ({ ...w, id: fresh(w.id) })),
    },
  };
}
