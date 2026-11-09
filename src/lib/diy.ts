import type { MaterialCommunityIcons } from '@expo/vector-icons';

import type { Expense } from './types';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type Room = { key: string; label: string; icon: IconName; categories: string[] };

/** Offered at the end of every room's list. Misc always comes last. */
const ALWAYS = ['Tools and supplies', 'Labor', 'Misc'];

/**
 * Rooms and the things people usually spend money on in each one. Users can
 * also name their own room and type their own category.
 */
export const ROOMS: Room[] = [
  {
    key: 'bathroom',
    label: 'Bathroom',
    icon: 'shower',
    categories: ['Floors', 'Paint', 'Lighting', 'Mirrors', 'Vanity', 'Shower tile', 'Tub or shower', 'Toilet', 'Faucets and fixtures', 'Hardware'],
  },
  {
    key: 'kitchen',
    label: 'Kitchen',
    icon: 'silverware-fork-knife',
    categories: ['Cabinets', 'Countertops', 'Backsplash', 'Floors', 'Paint', 'Lighting', 'Appliances', 'Sink and faucet', 'Hardware'],
  },
  {
    key: 'bedroom',
    label: 'Bedroom',
    icon: 'bed',
    categories: ['Floors', 'Paint', 'Lighting', 'Closet', 'Windows and blinds', 'Doors and trim', 'Furniture'],
  },
  {
    key: 'living',
    label: 'Living room',
    icon: 'sofa',
    categories: ['Floors', 'Paint', 'Lighting', 'Fireplace', 'Windows and blinds', 'Doors and trim', 'Built-ins', 'Furniture'],
  },
  {
    key: 'dining',
    label: 'Dining room',
    icon: 'table-chair',
    categories: ['Floors', 'Paint', 'Lighting', 'Windows and blinds', 'Doors and trim', 'Furniture'],
  },
  {
    key: 'laundry',
    label: 'Laundry room',
    icon: 'washing-machine',
    categories: ['Floors', 'Paint', 'Lighting', 'Cabinets and shelving', 'Plumbing', 'Appliances'],
  },
  {
    key: 'office',
    label: 'Office',
    icon: 'desk',
    categories: ['Floors', 'Paint', 'Lighting', 'Built-ins', 'Electrical', 'Furniture'],
  },
  {
    key: 'garage',
    label: 'Garage',
    icon: 'garage',
    categories: ['Floor coating', 'Storage', 'Lighting', 'Garage door', 'Electrical', 'Paint'],
  },
  {
    key: 'basement',
    label: 'Basement',
    icon: 'stairs-down',
    categories: ['Floors', 'Walls and framing', 'Paint', 'Lighting', 'Electrical', 'Plumbing'],
  },
  {
    key: 'hallway',
    label: 'Hallway or entry',
    icon: 'door-open',
    categories: ['Floors', 'Paint', 'Lighting', 'Doors and trim', 'Storage'],
  },
  {
    key: 'exterior',
    label: 'Exterior',
    icon: 'home-roof',
    categories: ['Roof', 'Siding or stucco', 'Windows', 'Doors', 'Paint', 'Gutters'],
  },
  {
    key: 'yard',
    label: 'Yard',
    icon: 'tree',
    categories: ['Landscaping', 'Fence', 'Deck or patio', 'Irrigation', 'Outdoor lighting', 'Shed'],
  },
];

/** Used for rooms the user names themselves. */
const OTHER_ROOM: Room = {
  key: 'other',
  label: 'Other',
  icon: 'hammer-wrench',
  categories: ['Floors', 'Paint', 'Lighting', 'Electrical', 'Plumbing', 'Materials'],
};

/** Always resolves to a room. Unknown keys get the general "Other" room. */
export function findRoom(key: string): Room {
  return ROOMS.find((r) => r.key === key) ?? OTHER_ROOM;
}

/**
 * Categories to offer for a project: the room's own list, then the ones every
 * room gets, with any custom ones already used on the project just before Misc.
 */
export function categoriesFor(roomKey: string, used: string[] = []): string[] {
  const list = [...findRoom(roomKey).categories, ...ALWAYS];
  const seen = new Set(list.map((c) => c.toLowerCase()));
  for (const c of used) {
    const name = c.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    list.splice(list.length - 1, 0, name);
    seen.add(name.toLowerCase());
  }
  return list;
}

export type ProjectTotals = {
  total: number;
  count: number;
  /** Categories with spending, biggest first. */
  byCategory: { category: string; total: number; count: number }[];
};

/** Sums in whole cents so many small amounts do not drift. */
export function projectTotals(expenses: Pick<Expense, 'category' | 'amount'>[]): ProjectTotals {
  const map = new Map<string, { category: string; cents: number; count: number }>();
  let cents = 0;
  for (const e of expenses) {
    const c = Math.round(e.amount * 100);
    cents += c;
    const key = e.category.toLowerCase();
    const row = map.get(key) ?? { category: e.category, cents: 0, count: 0 };
    row.cents += c;
    row.count += 1;
    map.set(key, row);
  }
  return {
    total: cents / 100,
    count: expenses.length,
    byCategory: [...map.values()]
      .sort((a, b) => b.cents - a.cents)
      .map((r) => ({ category: r.category, total: r.cents / 100, count: r.count })),
  };
}

/** "$1,234.50", or "$1,235" with cents off. Negative amounts read "-$80". */
export function money(n: number, cents = true): string {
  const digits = cents ? 2 : 0;
  const body = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${n < 0 ? '-' : ''}$${body}`;
}
