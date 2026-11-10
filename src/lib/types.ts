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
  /** Handy facts, such as where the water shutoff is or the tire size. */
  facts?: Spec[];
  /** Homes only. True when the home is rented out. */
  rental?: boolean;
  /** Local date (YYYY-MM-DD) the asset was added. */
  createdAt: string;
};

/** One saved detail about a job, such as "Oil weight: 5W-30". */
export type Spec = { label: string; value: string };

/** Something in a home that needs its own upkeep: a swamp cooler, a gas range. */
export type Appliance = {
  id: string;
  assetId: string;
  /** Keys into lib/appliances.ts. Custom appliances use "other". */
  category: string;
  option: string;
  name: string;
  brand?: string;
  model?: string;
  serial?: string;
  note?: string;
  photos: string[];
};

export type Task = {
  id: string;
  assetId: string;
  /** Set when the task belongs to one appliance in a home. */
  applianceId?: string;
  /** Parts and specs to remember for next time. */
  specs?: Spec[];
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
  /** What was used this time. */
  specs?: Spec[];
};

/** A pro to call: a plumber, an HVAC tech, a mechanic. */
export type Contact = {
  id: string;
  name: string;
  /** One of TRADES in lib/contacts.ts, or anything the user typed. */
  trade: string;
  phone?: string;
  note?: string;
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
  /** True once the user closes the getting started checklist. */
  hideStart?: boolean;
  /** Version of the safety notice the user agreed to, and when. */
  disclaimerVersion?: number;
  disclaimerAcceptedAt?: string;
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

/** A DIY job on a home, such as a bathroom remodel. */
export type Project = {
  id: string;
  assetId: string;
  name: string;
  /** Key into lib/diy.ts ROOMS, or "other". */
  room: string;
  /** Shown instead of the room label when the room is a custom one. */
  roomName?: string;
  budget?: number;
  /** Local date (YYYY-MM-DD) the project was added. */
  startedAt: string;
  done?: boolean;
  note?: string;
  /** Before, during and after pictures. */
  photos: string[];
};

/** One purchase on a project. */
export type Expense = {
  id: string;
  projectId: string;
  category: string;
  amount: number;
  description?: string;
  store?: string;
  /** Local date (YYYY-MM-DD) of the purchase. */
  date: string;
  /** Receipt pictures. */
  photos: string[];
};
