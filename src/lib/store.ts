import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { todayStr } from './due';
import type { Preset } from './presets';
import { findOption } from './appliances';
import type { Appliance, Asset, AssetKind, LogEntry, Settings, Spec, Task, WarrantyItem } from './types';

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

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
  settings: Settings;
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
  updateAsset: (id: string, patch: Partial<Pick<Asset, 'name' | 'mileage' | 'photo' | 'year' | 'make' | 'model'>>) => void;
  removeAsset: (id: string) => void;

  addTask: (input: Omit<Task, 'id' | 'startAt' | 'startMiles'>) => string;
  updateTask: (id: string, patch: Partial<Pick<Task, 'title' | 'note' | 'everyMonths' | 'everyMiles' | 'specs'>>) => void;
  removeTask: (id: string) => void;

  logDone: (
    taskId: string,
    input?: { doneAt?: string; miles?: number; cost?: number; note?: string; photos?: string[]; specs?: Spec[] }
  ) => void;
  removeLog: (id: string) => void;

  /** Adds an appliance to a home along with the upkeep tasks for its type. */
  addAppliance: (input: { assetId: string; category: string; option: string; name?: string }) => string;
  updateAppliance: (id: string, patch: Partial<Omit<Appliance, 'id' | 'assetId'>>) => void;
  removeAppliance: (id: string) => void;

  addWarranty: (input: Omit<WarrantyItem, 'id'>) => string;
  updateWarranty: (id: string, patch: Partial<Omit<WarrantyItem, 'id'>>) => void;
  removeWarranty: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
};

const defaults = {
  assets: [] as Asset[],
  tasks: [] as Task[],
  logs: [] as LogEntry[],
  warranties: [] as WarrantyItem[],
  appliances: [] as Appliance[],
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

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetAll: () => set({ ...defaults }),
    }),
    {
      name: 'upkeep-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ assets, tasks, logs, warranties, appliances, settings }) => ({
        assets,
        tasks,
        logs,
        warranties,
        appliances,
        settings,
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    }
  )
);
