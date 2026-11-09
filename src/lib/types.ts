export type AssetKind = 'home' | 'vehicle';

export type Asset = {
  id: string;
  kind: AssetKind;
  name: string;
  /** Current odometer reading. Vehicles only. */
  mileage?: number;
  /** Local date (YYYY-MM-DD) the asset was added. */
  createdAt: string;
};

export type Task = {
  id: string;
  assetId: string;
  title: string;
  note?: string;
  /** Repeat every N months. */
  everyMonths?: number;
  /** Repeat every N miles. Vehicles only. */
  everyMiles?: number;
  /** Starting point used until the task is logged for the first time. */
  startAt: string;
  startMiles?: number;
};

export type LogEntry = {
  id: string;
  taskId: string;
  assetId: string;
  /** Local date (YYYY-MM-DD) the work was done. */
  doneAt: string;
  miles?: number;
  cost?: number;
  note?: string;
};

export type Settings = {
  remindersOn: boolean;
  /** Remind this many days before a task is due. */
  leadDays: number;
};

export type DueStatus = 'overdue' | 'soon' | 'unlogged' | 'ok';

export type DueInfo = {
  status: DueStatus;
  dueDate?: string;
  dueMiles?: number;
  daysLeft?: number;
  milesLeft?: number;
  label: string;
  /** Lower sorts first. */
  rank: number;
};
