import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { todayStr } from './due';
import type { Preset } from './presets';
import type { Asset, AssetKind, LogEntry, Settings, Task } from './types';

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

type State = {
  assets: Asset[];
  tasks: Task[];
  logs: LogEntry[];
  settings: Settings;
  hydrated: boolean;

  addAsset: (input: { kind: AssetKind; name: string; mileage?: number; presets: Preset[] }) => string;
  updateAsset: (id: string, patch: Partial<Pick<Asset, 'name' | 'mileage'>>) => void;
  removeAsset: (id: string) => void;

  addTask: (input: Omit<Task, 'id' | 'startAt' | 'startMiles'>) => string;
  updateTask: (id: string, patch: Partial<Pick<Task, 'title' | 'note' | 'everyMonths' | 'everyMiles'>>) => void;
  removeTask: (id: string) => void;

  logDone: (taskId: string, input?: { doneAt?: string; miles?: number; cost?: number; note?: string }) => void;
  removeLog: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
};

const defaults = {
  assets: [] as Asset[],
  tasks: [] as Task[],
  logs: [] as LogEntry[],
  settings: { remindersOn: true, leadDays: 7 } as Settings,
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...defaults,
      hydrated: false,

      addAsset: ({ kind, name, mileage, presets }) => {
        const id = newId();
        const today = todayStr();
        const asset: Asset = { id, kind, name: name.trim(), createdAt: today };
        if (kind === 'vehicle' && mileage != null) asset.mileage = mileage;
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
        set((s) => ({ assets: [...s.assets, asset], tasks: [...s.tasks, ...tasks] }));
        return id;
      },

      updateAsset: (id, patch) =>
        set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

      removeAsset: (id) =>
        set((s) => ({
          assets: s.assets.filter((a) => a.id !== id),
          tasks: s.tasks.filter((t) => t.assetId !== id),
          logs: s.logs.filter((l) => l.assetId !== id),
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
        };
        set((s) => ({
          logs: [...s.logs, entry],
          // Logging a higher odometer reading also moves the vehicle forward.
          assets: s.assets.map((a) =>
            a.id === task.assetId && miles != null && miles > (a.mileage ?? 0) ? { ...a, mileage: miles } : a
          ),
        }));
      },

      removeLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetAll: () => set({ ...defaults }),
    }),
    {
      name: 'upkeep-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ assets, tasks, logs, settings }) => ({ assets, tasks, logs, settings }),
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    }
  )
);
