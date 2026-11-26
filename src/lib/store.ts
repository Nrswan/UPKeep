import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { todayStr } from './due';
import type { Preset } from './presets';
import { findOption, planTypeChange } from './appliances';
import type { BackupData } from './backup';
import type {
  Appliance,
  Asset,
  AssetKind,
  Chore,
  ChoreLog,
  Claim,
  Contact,
  HomeDoc,
  Member,
  Policy,
  ProJob,
  Purchase,
  Expense,
  LogEntry,
  Project,
  Settings,
  Spec,
  Task,
  WarrantyItem,
} from './types';

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** Builds an appliance record and the tasks its type calls for. */
function buildAppliance(assetId: string, category: string, option: string, today: string, name?: string) {
  const def = findOption(category, option);
  const appliance: Appliance = {
    id: newId(),
    assetId,
    category,
    option,
    name: name?.trim() || def?.label || 'Appliance',
    photos: [],
  };
  const tasks: Task[] = (def?.tasks ?? []).map((p) => ({
    id: newId(),
    assetId,
    applianceId: appliance.id,
    title: p.title,
    note: p.note,
    everyMonths: p.everyMonths,
    startAt: today,
  }));
  return { appliance, tasks };
}

type State = {
  assets: Asset[];
  tasks: Task[];
  logs: LogEntry[];
  warranties: WarrantyItem[];
  appliances: Appliance[];
  projects: Project[];
  expenses: Expense[];
  settings: Settings;
  /** Pros to call, shared across homes and vehicles. */
  contacts: Contact[];
  /** Records of work done by pros, with receipts. */
  proJobs: ProJob[];
  /** Products bought for each home or vehicle. */
  purchases: Purchase[];
  /** Seasonal checklist items ticked off, keyed by year and season: "2026-fall". */
  seasonChecks: Record<string, string[]>;
  docs: HomeDoc[];
  policies: Policy[];
  claims: Claim[];
  members: Member[];
  chores: Chore[];
  choreLogs: ChoreLog[];
  hydrated: boolean;

  addAsset: (input: {
    kind: AssetKind;
    name: string;
    mileage?: number;
    year?: number;
    make?: string;
    model?: string;
    photo?: string;
    presets: Preset[];
    /** Homes only. Each one is created along with its upkeep tasks. */
    appliances?: { category: string; option: string }[];
  }) => string;
  updateAsset: (id: string, patch: Partial<Pick<Asset, 'name' | 'mileage' | 'photo' | 'year' | 'make' | 'model' | 'facts' | 'rental'>>) => void;
  removeAsset: (id: string) => void;

  addTask: (input: Omit<Task, 'id' | 'startAt' | 'startMiles'>) => string;
  updateTask: (id: string, patch: Partial<Pick<Task, 'title' | 'note' | 'everyMonths' | 'everyMiles' | 'specs'>>) => void;
  removeTask: (id: string) => void;

  logDone: (
    taskId: string,
    input?: { doneAt?: string; miles?: number; cost?: number; note?: string; photos?: string[]; specs?: Spec[]; contactId?: string }
  ) => void;
  removeLog: (id: string) => void;

  /** Adds an appliance to a home along with the upkeep tasks for its type. */
  addAppliance: (input: { assetId: string; category: string; option: string; name?: string }) => string;
  updateAppliance: (id: string, patch: Partial<Omit<Appliance, 'id' | 'assetId'>>) => void;
  removeAppliance: (id: string) => void;
  /** Switches an appliance to another type and swaps its upkeep tasks to match. */
  setApplianceType: (id: string, option: string) => void;

  addWarranty: (input: Omit<WarrantyItem, 'id'>) => string;
  updateWarranty: (id: string, patch: Partial<Omit<WarrantyItem, 'id'>>) => void;
  removeWarranty: (id: string) => void;

  addProject: (input: Omit<Project, 'id' | 'startedAt' | 'photos'>) => string;
  updateProject: (id: string, patch: Partial<Omit<Project, 'id' | 'assetId'>>) => void;
  removeProject: (id: string) => void;
  addExpense: (input: Omit<Expense, 'id'>) => string;
  updateExpense: (id: string, patch: Partial<Omit<Expense, 'id' | 'projectId'>>) => void;
  removeExpense: (id: string) => void;

  addContact: (input: Omit<Contact, 'id'>) => string;
  updateContact: (id: string, patch: Partial<Omit<Contact, 'id'>>) => void;
  /** Also removes the pro's job records. Upkeep logs they did are kept. */
  removeContact: (id: string) => void;
  addPurchase: (input: Omit<Purchase, 'id'>) => string;
  updatePurchase: (id: string, patch: Partial<Omit<Purchase, 'id'>>) => void;
  removePurchase: (id: string) => void;
  /** Adds records received from a previous owner. */
  importRecords: (data: Partial<BackupData>) => void;
  addProJob: (input: Omit<ProJob, 'id'>) => string;
  updateProJob: (id: string, patch: Partial<Omit<ProJob, 'id' | 'contactId'>>) => void;
  removeProJob: (id: string) => void;
  toggleSeasonItem: (key: string, itemId: string) => void;

  addDoc: (input: Omit<HomeDoc, 'id'>) => string;
  updateDoc: (id: string, patch: Partial<Omit<HomeDoc, 'id'>>) => void;
  removeDoc: (id: string) => void;
  addPolicy: (input: Omit<Policy, 'id'>) => string;
  updatePolicy: (id: string, patch: Partial<Omit<Policy, 'id'>>) => void;
  /** Claims on the policy are kept without the link. */
  removePolicy: (id: string) => void;
  addClaim: (input: Omit<Claim, 'id'>) => string;
  updateClaim: (id: string, patch: Partial<Omit<Claim, 'id'>>) => void;
  removeClaim: (id: string) => void;

  addMember: (input: Omit<Member, 'id'>) => string;
  updateMember: (id: string, patch: Partial<Omit<Member, 'id'>>) => void;
  /** Their chores become open to anyone. */
  removeMember: (id: string) => void;
  addChore: (input: Omit<Chore, 'id'>) => string;
  updateChore: (id: string, patch: Partial<Omit<Chore, 'id'>>) => void;
  removeChore: (id: string) => void;
  /** Checks a chore off for today, or undoes today's check. */
  toggleChoreDone: (choreId: string, memberId?: string) => void;

  /** Replaces everything with the contents of a backup. */
  restoreAll: (data: BackupData) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
};

const defaults = {
  assets: [] as Asset[],
  tasks: [] as Task[],
  logs: [] as LogEntry[],
  warranties: [] as WarrantyItem[],
  appliances: [] as Appliance[],
  projects: [] as Project[],
  expenses: [] as Expense[],
  contacts: [] as Contact[],
  proJobs: [] as ProJob[],
  purchases: [] as Purchase[],
  seasonChecks: {} as Record<string, string[]>,
  docs: [] as HomeDoc[],
  policies: [] as Policy[],
  claims: [] as Claim[],
  members: [] as Member[],
  chores: [] as Chore[],
  choreLogs: [] as ChoreLog[],
  settings: { remindersOn: true, leadDays: 7 } as Settings,
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...defaults,
      hydrated: false,

      addAsset: ({ kind, name, mileage, year, make, model, photo, presets, appliances }) => {
        const id = newId();
        const today = todayStr();
        const asset: Asset = { id, kind, name: name.trim(), createdAt: today };
        if (kind === 'vehicle' && mileage != null) asset.mileage = mileage;
        if (kind === 'vehicle') Object.assign(asset, { year, make, model });
        if (photo) asset.photo = photo;
        const tasks: Task[] = presets.map((p) => ({
          id: newId(),
          assetId: id,
          title: p.title,
          note: p.note,
          everyMonths: p.everyMonths,
          everyMiles: kind === 'vehicle' ? p.everyMiles : undefined,
          startAt: today,
          startMiles: asset.mileage,
        }));
        const built = kind === 'home' ? (appliances ?? []).map((a) => buildAppliance(id, a.category, a.option, today)) : [];
        set((s) => ({
          assets: [...s.assets, asset],
          tasks: [...s.tasks, ...tasks, ...built.flatMap((b) => b.tasks)],
          appliances: [...s.appliances, ...built.map((b) => b.appliance)],
        }));
        return id;
      },

      updateAsset: (id, patch) =>
        set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

      removeAsset: (id) =>
        set((s) => ({
          assets: s.assets.filter((a) => a.id !== id),
          tasks: s.tasks.filter((t) => t.assetId !== id),
          logs: s.logs.filter((l) => l.assetId !== id),
          appliances: s.appliances.filter((a) => a.assetId !== id),
          projects: s.projects.filter((p) => p.assetId !== id),
          purchases: s.purchases.filter((p) => p.assetId !== id),
          // Pro job records belong to the pro, so they stay without the link.
          proJobs: s.proJobs.map((j) => (j.assetId === id ? { ...j, assetId: undefined } : j)),
          expenses: s.expenses.filter((e) => !s.projects.some((p) => p.assetId === id && p.id === e.projectId)),
          // Important papers and insurance records are kept. They just lose the link.
          docs: s.docs.map((d) => (d.assetId === id ? { ...d, assetId: undefined } : d)),
          policies: s.policies.map((p) => (p.assetId === id ? { ...p, assetId: undefined } : p)),
          claims: s.claims.map((c) => (c.assetId === id ? { ...c, assetId: undefined } : c)),
        })),

      addTask: (input) => {
        const id = newId();
        const asset = get().assets.find((a) => a.id === input.assetId);
        const task: Task = { ...input, id, startAt: todayStr(), startMiles: asset?.mileage };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return id;
      },

      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          logs: s.logs.filter((l) => l.taskId !== id),
        })),

      logDone: (taskId, input = {}) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        const asset = get().assets.find((a) => a.id === task.assetId);
        const doneAt = input.doneAt ?? todayStr();
        // A vehicle log always carries a mileage so the next mileage due point can be worked out.
        const miles = asset?.kind === 'vehicle' ? (input.miles ?? asset.mileage) : undefined;
        const entry: LogEntry = {
          id: newId(),
          taskId,
          assetId: task.assetId,
          doneAt,
          miles,
          cost: input.cost,
          note: input.note?.trim() || undefined,
          photos: input.photos?.length ? input.photos : undefined,
          specs: input.specs?.length ? input.specs : undefined,
          contactId: input.contactId || undefined,
        };
        set((s) => ({
          logs: [...s.logs, entry],
          // What was used this time becomes what to buy next time.
          tasks: input.specs ? s.tasks.map((t) => (t.id === taskId ? { ...t, specs: input.specs } : t)) : s.tasks,
          // Logging a higher odometer reading also moves the vehicle forward.
          assets: s.assets.map((a) =>
            a.id === task.assetId && miles != null && miles > (a.mileage ?? 0) ? { ...a, mileage: miles } : a
          ),
        }));
      },

      removeLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),

      addAppliance: ({ assetId, category, option, name }) => {
        const { appliance, tasks } = buildAppliance(assetId, category, option, todayStr(), name);
        set((s) => ({ appliances: [...s.appliances, appliance], tasks: [...s.tasks, ...tasks] }));
        return appliance.id;
      },

      updateAppliance: (id, patch) =>
        set((s) => ({ appliances: s.appliances.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

      setApplianceType: (id, option) =>
        set((s) => {
          const item = s.appliances.find((a) => a.id === id);
          if (!item || item.option === option) return {};
          const mine = s.tasks.filter((t) => t.applianceId === id);
          const logged = new Set(s.logs.map((l) => l.taskId));
          const plan = planTypeChange(mine, logged, item.category, option);
          const gone = new Set(plan.removeIds);
          const today = todayStr();
          const added: Task[] = plan.add.map((p) => ({
            id: newId(),
            assetId: item.assetId,
            applianceId: id,
            title: p.title,
            note: p.note,
            everyMonths: p.everyMonths,
            startAt: today,
          }));
          // Keep a name the owner typed. Replace the default one.
          const oldLabel = findOption(item.category, item.option)?.label;
          const newLabel = findOption(item.category, option)?.label;
          const name = item.name === oldLabel && newLabel ? newLabel : item.name;
          return {
            appliances: s.appliances.map((a) => (a.id === id ? { ...a, option, name } : a)),
            tasks: [...s.tasks.filter((t) => !gone.has(t.id)), ...added],
          };
        }),

      removeAppliance: (id) =>
        set((s) => {
          const gone = new Set(s.tasks.filter((t) => t.applianceId === id).map((t) => t.id));
          return {
            appliances: s.appliances.filter((a) => a.id !== id),
            tasks: s.tasks.filter((t) => !gone.has(t.id)),
            logs: s.logs.filter((l) => !gone.has(l.taskId)),
          };
        }),

      addWarranty: (input) => {
        const id = newId();
        set((s) => ({ warranties: [...s.warranties, { ...input, id }] }));
        return id;
      },

      updateWarranty: (id, patch) =>
        set((s) => ({ warranties: s.warranties.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),

      removeWarranty: (id) => set((s) => ({ warranties: s.warranties.filter((w) => w.id !== id) })),

      addProject: (input) => {
        const id = newId();
        set((s) => ({ projects: [...s.projects, { ...input, id, startedAt: todayStr(), photos: [] }] }));
        return id;
      },

      updateProject: (id, patch) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      removeProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          expenses: s.expenses.filter((e) => e.projectId !== id),
        })),

      addExpense: (input) => {
        const id = newId();
        set((s) => ({ expenses: [...s.expenses, { ...input, id }] }));
        return id;
      },

      updateExpense: (id, patch) =>
        set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),

      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addContact: (input) => {
        const id = newId();
        set((s) => ({ contacts: [...s.contacts, { ...input, id }] }));
        return id;
      },

      updateContact: (id, patch) =>
        set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      removeContact: (id) =>
        set((s) => ({
          contacts: s.contacts.filter((c) => c.id !== id),
          proJobs: s.proJobs.filter((j) => j.contactId !== id),
          logs: s.logs.map((l) => (l.contactId === id ? { ...l, contactId: undefined } : l)),
        })),

      addPurchase: (input) => {
        const id = newId();
        set((s) => ({ purchases: [...s.purchases, { ...input, id }] }));
        return id;
      },

      updatePurchase: (id, patch) =>
        set((s) => ({ purchases: s.purchases.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      removePurchase: (id) => set((s) => ({ purchases: s.purchases.filter((p) => p.id !== id) })),

      importRecords: (data) =>
        set((s) => ({
          assets: [...s.assets, ...(data.assets ?? [])],
          tasks: [...s.tasks, ...(data.tasks ?? [])],
          logs: [...s.logs, ...(data.logs ?? [])],
          warranties: [...s.warranties, ...(data.warranties ?? [])],
          appliances: [...s.appliances, ...(data.appliances ?? [])],
          projects: [...s.projects, ...(data.projects ?? [])],
          expenses: [...s.expenses, ...(data.expenses ?? [])],
          contacts: [...s.contacts, ...(data.contacts ?? [])],
          proJobs: [...s.proJobs, ...(data.proJobs ?? [])],
          purchases: [...s.purchases, ...(data.purchases ?? [])],
          docs: [...s.docs, ...(data.docs ?? [])],
        })),

      addProJob: (input) => {
        const id = newId();
        set((s) => ({ proJobs: [...s.proJobs, { ...input, id }] }));
        return id;
      },

      updateProJob: (id, patch) =>
        set((s) => ({ proJobs: s.proJobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),

      removeProJob: (id) => set((s) => ({ proJobs: s.proJobs.filter((j) => j.id !== id) })),

      toggleSeasonItem: (key, itemId) =>
        set((s) => {
          const have = s.seasonChecks[key] ?? [];
          const next = have.includes(itemId) ? have.filter((x) => x !== itemId) : [...have, itemId];
          return { seasonChecks: { ...s.seasonChecks, [key]: next } };
        }),

      addDoc: (input) => {
        const id = newId();
        set((s) => ({ docs: [...s.docs, { ...input, id }] }));
        return id;
      },
      updateDoc: (id, patch) => set((s) => ({ docs: s.docs.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      removeDoc: (id) => set((s) => ({ docs: s.docs.filter((d) => d.id !== id) })),

      addPolicy: (input) => {
        const id = newId();
        set((s) => ({ policies: [...s.policies, { ...input, id }] }));
        return id;
      },
      updatePolicy: (id, patch) => set((s) => ({ policies: s.policies.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removePolicy: (id) =>
        set((s) => ({
          policies: s.policies.filter((p) => p.id !== id),
          claims: s.claims.map((c) => (c.policyId === id ? { ...c, policyId: undefined } : c)),
        })),

      addClaim: (input) => {
        const id = newId();
        set((s) => ({ claims: [...s.claims, { ...input, id }] }));
        return id;
      },
      updateClaim: (id, patch) => set((s) => ({ claims: s.claims.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeClaim: (id) => set((s) => ({ claims: s.claims.filter((c) => c.id !== id) })),

      addMember: (input) => {
        const id = newId();
        set((s) => ({ members: [...s.members, { ...input, name: input.name.trim(), id }] }));
        return id;
      },
      updateMember: (id, patch) => set((s) => ({ members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      removeMember: (id) =>
        set((s) => ({
          members: s.members.filter((m) => m.id !== id),
          chores: s.chores.map((c) => (c.memberId === id ? { ...c, memberId: undefined } : c)),
          choreLogs: s.choreLogs.map((l) => (l.memberId === id ? { ...l, memberId: undefined } : l)),
        })),

      addChore: (input) => {
        const id = newId();
        set((s) => ({ chores: [...s.chores, { ...input, title: input.title.trim(), id }] }));
        return id;
      },
      updateChore: (id, patch) => set((s) => ({ chores: s.chores.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeChore: (id) =>
        set((s) => ({ chores: s.chores.filter((c) => c.id !== id), choreLogs: s.choreLogs.filter((l) => l.choreId !== id) })),

      toggleChoreDone: (choreId, memberId) =>
        set((s) => {
          const today = todayStr();
          const mine = s.choreLogs.find((l) => l.choreId === choreId && l.doneAt === today);
          if (mine) return { choreLogs: s.choreLogs.filter((l) => l.id !== mine.id) };
          const chore = s.chores.find((c) => c.id === choreId);
          if (!chore) return {};
          return { choreLogs: [...s.choreLogs, { id: newId(), choreId, memberId: memberId ?? chore.memberId, doneAt: today }] };
        }),

      restoreAll: (data) =>
        set((s) => ({
          ...defaults,
          ...data,
          // The agreement to the safety notice belongs to this install, not the backup.
          settings: {
            ...data.settings,
            disclaimerVersion: s.settings.disclaimerVersion,
            disclaimerAcceptedAt: s.settings.disclaimerAcceptedAt,
            // A restore is also the way back in after a forgotten household PIN.
            householdPin: undefined,
          },
        })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetAll: () => set({ ...defaults }),
    }),
    {
      name: 'upkeep-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({
        assets,
        tasks,
        logs,
        warranties,
        appliances,
        projects,
        expenses,
        contacts,
        proJobs,
        purchases,
        seasonChecks,
        docs,
        policies,
        claims,
        members,
        chores,
        choreLogs,
        settings,
      }) => ({
        assets,
        tasks,
        logs,
        warranties,
        appliances,
        projects,
        expenses,
        contacts,
        proJobs,
        purchases,
        seasonChecks,
        docs,
        policies,
        claims,
        members,
        chores,
        choreLogs,
        settings,
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    }
  )
);
