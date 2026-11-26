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
  /** The pro who did the work, if not the owner. */
  contactId?: string;
};

/** A pro to call: a plumber, an HVAC tech, a mechanic. */
export type Contact = {
  id: string;
  name: string;
  /** One of TRADES in lib/contacts.ts, or anything the user typed. */
  trade: string;
  phone?: string;
  email?: string;
  website?: string;
  /** 1 to 5 stars from the owner. */
  rating?: number;
  note?: string;
};

/** A product bought for a home or vehicle, saved so it is easy to buy again. */
export type Purchase = {
  id: string;
  assetId: string;
  /** Key from lib/purchases.ts, or "other". */
  category: string;
  /** What it is: "Kitchen can lights", "Living room walls". */
  name: string;
  brand?: string;
  /** Where it was bought. */
  store?: string;
  price?: number;
  /** Local date (YYYY-MM-DD) it was bought. */
  date?: string;
  /** Category details such as color code, sheen or bulb base. */
  specs: Spec[];
  note?: string;
  /** The product, its label or the receipt. */
  photos: string[];
};

/** A job a pro did, with its receipt and records. */
export type ProJob = {
  id: string;
  contactId: string;
  /** The home or vehicle the work was on, if any. */
  assetId?: string;
  /** What they did: "Replaced the water heater". */
  title: string;
  /** Local date (YYYY-MM-DD) of the work. */
  date: string;
  cost?: number;
  note?: string;
  /** Receipts, invoices and before and after pictures. */
  photos: string[];
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

/** An important paper: closing documents, a deed, a permit, an inspection. */
export type HomeDoc = {
  id: string;
  /** The home or vehicle it belongs to. Blank for papers that cover everything. */
  assetId?: string;
  /** Key from DOC_CATEGORIES in lib/insurance.ts. */
  category: string;
  title: string;
  /** Local date (YYYY-MM-DD) on the paper. */
  date?: string;
  note?: string;
  /** Photos and PDF files, by saved file name. */
  photos: string[];
};

/** An insurance policy for a home, a vehicle or something else. */
export type Policy = {
  id: string;
  assetId?: string;
  /** Key from POLICY_TYPES in lib/insurance.ts. */
  type: string;
  company: string;
  policyNumber?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  /** The number to call to start a claim. */
  claimsPhone?: string;
  /** Main coverage amount, such as dwelling coverage. */
  coverage?: number;
  deductible?: number;
  premium?: number;
  /** How often the premium is paid. */
  premiumEvery?: 'year' | 'half' | 'month';
  /** Local date (YYYY-MM-DD) the policy renews. */
  renewsAt?: string;
  note?: string;
  /** Declarations page, ID cards and the policy itself. */
  photos: string[];
};

/** A claim made on a policy. */
export type Claim = {
  id: string;
  policyId?: string;
  assetId?: string;
  /** What happened: "Hail damage to the roof". */
  title: string;
  /** Local date (YYYY-MM-DD) of the loss. */
  date: string;
  claimNumber?: string;
  /** Key from CLAIM_STATUSES in lib/insurance.ts. */
  status: string;
  adjuster?: string;
  adjusterPhone?: string;
  /** Amount asked for. */
  claimed?: number;
  /** Amount paid out. */
  paid?: number;
  note?: string;
  /** Damage pictures, estimates and letters. */
  photos: string[];
};

/** Someone in the household. */
export type Member = {
  id: string;
  name: string;
  /** owner can change chores and people. The rest can only check chores off. */
  role: 'owner' | 'adult' | 'roommate' | 'kid';
  /** Key from MEMBER_COLORS in lib/chores.ts. */
  color: string;
};

/** A household chore. */
export type Chore = {
  id: string;
  title: string;
  /** Who it is assigned to. Blank means anyone. */
  memberId?: string;
  /** Repeat every N days. Blank means it is done once. */
  everyDays?: number;
  /** Local date (YYYY-MM-DD) it is first due. */
  startAt: string;
  note?: string;
};

export type ChoreLog = {
  id: string;
  choreId: string;
  /** Who did it. */
  memberId?: string;
  /** Local date (YYYY-MM-DD). */
  doneAt: string;
};

export type Settings = {
  remindersOn: boolean;
  /** Four digit code that protects changes to chores and people. */
  householdPin?: string;
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
