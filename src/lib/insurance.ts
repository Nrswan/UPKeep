import { diffDays, formatDate } from './due';
import type { AssetKind, Claim, HomeDoc, Policy } from './types';

/**
 * Insurance policies, claims and important papers. Kept as plain data and
 * functions so they can be tested without a phone.
 */
export type Choice = { key: string; label: string; icon: string; color: string };

export const POLICY_TYPES: Choice[] = [
  { key: 'home', label: 'Homeowners', icon: 'home-roof', color: '#1F8A63' },
  { key: 'auto', label: 'Auto', icon: 'car-outline', color: '#2D7FD3' },
  { key: 'renters', label: 'Renters', icon: 'key-outline', color: '#7B56D6' },
  { key: 'landlord', label: 'Landlord or rental', icon: 'home-city-outline', color: '#176B7A' },
  { key: 'flood', label: 'Flood', icon: 'home-flood', color: '#1B4E96' },
  { key: 'umbrella', label: 'Umbrella', icon: 'umbrella-outline', color: '#B8431C' },
  { key: 'warranty', label: 'Home warranty', icon: 'shield-home-outline', color: '#E07B1F' },
  { key: 'other', label: 'Other', icon: 'file-certificate-outline', color: '#5E6B64' },
];

export const CLAIM_STATUSES: { key: string; label: string; open: boolean }[] = [
  { key: 'filed', label: 'Filed', open: true },
  { key: 'review', label: 'Being reviewed', open: true },
  { key: 'approved', label: 'Approved', open: true },
  { key: 'paid', label: 'Paid', open: false },
  { key: 'denied', label: 'Denied', open: false },
  { key: 'closed', label: 'Closed', open: false },
];

export const DOC_CATEGORIES: Choice[] = [
  { key: 'closing', label: 'Purchase and closing', icon: 'file-sign', color: '#1F8A63' },
  { key: 'deed', label: 'Deed and title', icon: 'certificate-outline', color: '#176B7A' },
  { key: 'mortgage', label: 'Mortgage and loan', icon: 'bank-outline', color: '#1B4E96' },
  { key: 'insurance', label: 'Insurance', icon: 'shield-check-outline', color: '#2D7FD3' },
  { key: 'claim', label: 'Claim papers', icon: 'file-alert-outline', color: '#B3261E' },
  { key: 'inspection', label: 'Inspection', icon: 'clipboard-check-outline', color: '#7B56D6' },
  { key: 'permit', label: 'Permits', icon: 'stamper', color: '#E07B1F' },
  { key: 'survey', label: 'Survey and plans', icon: 'floor-plan', color: '#8A5A00' },
  { key: 'tax', label: 'Property tax', icon: 'calculator-variant-outline', color: '#B8431C' },
  { key: 'hoa', label: 'HOA', icon: 'account-group-outline', color: '#6D4AC4' },
  { key: 'lease', label: 'Lease', icon: 'key-chain', color: '#176B7A' },
  { key: 'title', label: 'Vehicle title', icon: 'card-account-details-outline', color: '#2D7FD3' },
  { key: 'registration', label: 'Registration', icon: 'card-text-outline', color: '#1B4E96' },
  { key: 'manual', label: 'Manuals', icon: 'book-open-variant', color: '#5E6B64' },
  { key: 'receipt', label: 'Big receipts', icon: 'receipt', color: '#1F8A63' },
  { key: 'other', label: 'Other', icon: 'file-outline', color: '#5E6B64' },
];

const HOME_DOCS = ['closing', 'deed', 'mortgage', 'insurance', 'claim', 'inspection', 'permit', 'survey', 'tax', 'hoa', 'lease', 'manual', 'receipt', 'other'];
const VEHICLE_DOCS = ['title', 'registration', 'insurance', 'claim', 'inspection', 'mortgage', 'manual', 'receipt', 'other'];

/** Categories that fit a home or a vehicle. Without a kind, all of them. */
export function docCategories(kind?: AssetKind): Choice[] {
  if (!kind) return DOC_CATEGORIES;
  const keys = kind === 'home' ? HOME_DOCS : VEHICLE_DOCS;
  return keys.map((k) => docCategory(k));
}

export function docCategory(key: string): Choice {
  return DOC_CATEGORIES.find((c) => c.key === key) ?? DOC_CATEGORIES[DOC_CATEGORIES.length - 1];
}

export function policyType(key: string): Choice {
  return POLICY_TYPES.find((c) => c.key === key) ?? POLICY_TYPES[POLICY_TYPES.length - 1];
}

export function claimStatus(key: string) {
  return CLAIM_STATUSES.find((c) => c.key === key) ?? CLAIM_STATUSES[0];
}

/** Policy types that make sense for a home or vehicle. */
export function policyTypesFor(kind?: AssetKind): Choice[] {
  if (kind === 'vehicle') return POLICY_TYPES.filter((p) => ['auto', 'umbrella', 'other'].includes(p.key));
  if (kind === 'home') return POLICY_TYPES.filter((p) => p.key !== 'auto');
  return POLICY_TYPES;
}

export type InsuranceFact = { group: string; label: string; hint: string };

/**
 * The questions insurance agents ask about a home when quoting or renewing.
 * Saved with the home's other facts so they show up on the insurance PDF.
 */
export const INSURANCE_HOME_FACTS: InsuranceFact[] = [
  { group: 'The building', label: 'Address', hint: '123 Main St, Albuquerque, NM 87110' },
  { group: 'The building', label: 'Year built', hint: '1998' },
  { group: 'The building', label: 'Square feet', hint: '1,850' },
  { group: 'The building', label: 'Stories', hint: '1' },
  { group: 'The building', label: 'Construction', hint: 'Frame and stucco, brick, block' },
  { group: 'The building', label: 'Foundation', hint: 'Slab, crawl space, basement' },
  { group: 'The building', label: 'Garage', hint: 'Attached 2 car' },
  { group: 'Roof', label: 'Roof material', hint: 'Asphalt shingle, tile, metal, flat' },
  { group: 'Roof', label: 'Roof replaced (year)', hint: '2019' },
  { group: 'Systems', label: 'Heating type', hint: 'Gas furnace, heat pump, boiler' },
  { group: 'Systems', label: 'Heating installed (year)', hint: '2015' },
  { group: 'Systems', label: 'Cooling type', hint: 'Central air, swamp cooler, none' },
  { group: 'Systems', label: 'Cooling installed (year)', hint: '2015' },
  { group: 'Systems', label: 'Water heater installed (year)', hint: '2020' },
  { group: 'Systems', label: 'Electrical panel', hint: '200 amp breakers' },
  { group: 'Systems', label: 'Electrical updated (year)', hint: '2010' },
  { group: 'Systems', label: 'Plumbing type', hint: 'Copper, PEX, galvanized' },
  { group: 'Systems', label: 'Plumbing updated (year)', hint: '2010' },
  { group: 'Safety', label: 'Smoke alarms', hint: 'Every bedroom and hallway' },
  { group: 'Safety', label: 'Carbon monoxide alarms', hint: 'Yes, 2' },
  { group: 'Safety', label: 'Security alarm', hint: 'Monitored by ADT' },
  { group: 'Safety', label: 'Fire extinguisher', hint: 'Kitchen and garage' },
  { group: 'Safety', label: 'Fire sprinklers', hint: 'No' },
  { group: 'Safety', label: 'Deadbolts', hint: 'All outside doors' },
  { group: 'Safety', label: 'Water leak sensors or shutoff', hint: 'Sensors under sinks' },
  { group: 'Things they ask about', label: 'Wood stove or fireplace', hint: 'Gas fireplace' },
  { group: 'Things they ask about', label: 'Pool or hot tub', hint: 'None' },
  { group: 'Things they ask about', label: 'Trampoline', hint: 'None' },
  { group: 'Things they ask about', label: 'Dogs (breed)', hint: 'Two labs' },
  { group: 'Things they ask about', label: 'Distance to fire hydrant', hint: 'Under 500 feet' },
  { group: 'Things they ask about', label: 'Nearest fire station', hint: '2 miles' },
];

export const INSURANCE_VEHICLE_FACTS: InsuranceFact[] = [
  { group: 'The vehicle', label: 'License plate', hint: 'ABC1234' },
  { group: 'The vehicle', label: 'VIN', hint: '17 characters' },
  { group: 'The vehicle', label: 'Primary driver', hint: 'Name' },
  { group: 'The vehicle', label: 'Miles driven per year', hint: '12,000' },
  { group: 'The vehicle', label: 'Use', hint: 'Commute, pleasure, business' },
  { group: 'The vehicle', label: 'Parked at night', hint: 'Garage, driveway, street' },
  { group: 'The vehicle', label: 'Anti-theft', hint: 'Factory alarm, tracker' },
  { group: 'The vehicle', label: 'Loan or lease', hint: 'Lender name, or owned' },
  { group: 'The vehicle', label: 'Modifications', hint: 'Lift kit, aftermarket wheels' },
];

export function insuranceFacts(kind: AssetKind) {
  return kind === 'home' ? INSURANCE_HOME_FACTS : INSURANCE_VEHICLE_FACTS;
}

export const RENEW_SOON_DAYS = 30;

export type RenewalInfo = { status: 'none' | 'past' | 'soon' | 'ok'; daysLeft?: number; label: string };

export function renewalInfo(p: Pick<Policy, 'renewsAt'>, today: string): RenewalInfo {
  if (!p.renewsAt) return { status: 'none', label: 'No renewal date' };
  const daysLeft = diffDays(today, p.renewsAt);
  if (daysLeft < 0) return { status: 'past', daysLeft, label: `Renewal date passed ${formatDate(p.renewsAt)}` };
  if (daysLeft === 0) return { status: 'soon', daysLeft, label: 'Renews today' };
  if (daysLeft <= RENEW_SOON_DAYS) return { status: 'soon', daysLeft, label: `Renews in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` };
  return { status: 'ok', daysLeft, label: `Renews ${formatDate(p.renewsAt)}` };
}

/** Premium for a full year, in dollars. */
export function yearlyPremium(p: Pick<Policy, 'premium' | 'premiumEvery'>): number | undefined {
  if (p.premium == null) return undefined;
  const times = p.premiumEvery === 'month' ? 12 : p.premiumEvery === 'half' ? 2 : 1;
  return Math.round(p.premium * times * 100) / 100;
}

/** Claims newest first. */
export function sortClaims(claims: Claim[]): Claim[] {
  return [...claims].reverse().sort((a, b) => b.date.localeCompare(a.date));
}

/** Claims in the last N years, which is the window most insurers ask about. */
export function recentClaims(claims: Claim[], today: string, years = 5): Claim[] {
  const from = `${Number(today.slice(0, 4)) - years}${today.slice(4)}`;
  return sortClaims(claims.filter((c) => c.date >= from));
}

/** True for saved file names that are PDFs rather than pictures. */
export function isPdf(name: string): boolean {
  return /\.pdf$/i.test(name.split('?')[0]);
}

/**
 * Saved files keep the original name after a double underscore, like
 * "k3x9a__Closing-Disclosure.pdf". This turns that back into "Closing Disclosure".
 */
export function fileLabel(name: string, index = 0): string {
  const base = name.split('/').pop() ?? name;
  const after = base.includes('__') ? base.slice(base.indexOf('__') + 2) : '';
  const clean = after.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  return clean || (isPdf(name) ? `PDF ${index + 1}` : `Photo ${index + 1}`);
}

/** A safe saved name for a picked file. Keeps letters, numbers and dashes from the original name. */
export function safeFileName(original: string, id: string): string {
  const base = original.split(/[\\/]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  const ext = dot > 0 ? base.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) : '';
  const stem = (dot > 0 ? base.slice(0, dot) : base).replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return `${id}${stem ? `__${stem}` : ''}.${ext || 'pdf'}`;
}

export function matchesDoc(d: HomeDoc, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [d.title, d.note, docCategory(d.category).label].some((v) => v?.toLowerCase().includes(q));
}
