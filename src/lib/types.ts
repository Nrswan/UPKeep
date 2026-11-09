export type AssetKind = 'home' | 'vehicle';

export type Asset = {
  id: string;
  kind: AssetKind;
  name: string;
  /** Current odometer reading. Vehicles only. */
  mileage?: number;
  year?: number;
  make?: string;
  model?: string;
  /** File name of a photo saved by lib/photos.ts. */
  photo?: string;
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
  photos?: string[];
};

/** Something you bought that carries a warranty: an appliance, a roof, a tool. */
export type WarrantyItem = {
  id: string;
  name: string;
  /** Local date (YYYY-MM-DD) of purchase or install. */
  purchasedAt: string;
  /** Warranty length in months. */
  months: number;
  price?: number;
  retailer?: string;
  note?: string;
  /** Receipts, serial plates and the item itself. */
  photos: string[];
};

export type WarrantyInfo = {
  status: 'expired' | 'soon' | 'ok';
  expiresAt: string;
  daysLeft: number;
  label: string;
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
