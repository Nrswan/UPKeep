/**
 * Kinds of pros, which jobs call for which pro, and how to find a good one.
 * The search text is what a person would type into Google, so it matches how
 * the trade is actually listed.
 */
export type TradeInfo = {
  /** Saved on contacts. Kept short and stable. */
  key: string;
  /** How to say it in a sentence: "an HVAC technician". */
  title: string;
  article: 'a' | 'an';
  /** Default Google search. */
  search: string;
  /** One or two things that matter for this trade in particular. */
  tips: string[];
  icon: string;
  color: string;
};

export const TRADE_INFO: TradeInfo[] = [
  {
    key: 'HVAC',
    title: 'HVAC technician',
    article: 'an',
    search: 'HVAC technician near me',
    tips: ['Ask if they work on your type of system, such as swamp coolers, heat pumps or mini splits.', 'A tune-up plan can be cheaper than paying for visits one at a time.'],
    icon: 'air-conditioner',
    color: '#0E7490',
  },
  {
    key: 'Plumber',
    title: 'plumber',
    article: 'a',
    search: 'licensed plumber near me',
    tips: ['For a water heater swap, ask if haul-away of the old tank and the permit are in the price.'],
    icon: 'pipe-wrench',
    color: '#0369A1',
  },
  {
    key: 'Electrician',
    title: 'electrician',
    article: 'an',
    search: 'licensed electrician near me',
    tips: ['Electrical work often needs a permit. A licensed electrician pulls it for you.'],
    icon: 'flash',
    color: '#CA8A04',
  },
  {
    key: 'Mechanic',
    title: 'mechanic',
    article: 'a',
    search: 'auto repair shop near me',
    tips: ['Look for ASE certified technicians.', 'Ask them to show you or save the old parts they replace.'],
    icon: 'car-wrench',
    color: '#475569',
  },
  {
    key: 'Roofer',
    title: 'roofer',
    article: 'a',
    search: 'roofing contractor near me',
    tips: ['Get two or three written bids for anything bigger than a small repair.', 'Be wary of door to door roofers who show up right after a storm.'],
    icon: 'home-roof',
    color: '#92400E',
  },
  {
    key: 'Appliance repair',
    title: 'appliance repair technician',
    article: 'an',
    search: 'appliance repair near me',
    tips: ['Have the brand and model number ready. They are on the appliance page in this app if you saved them.'],
    icon: 'washing-machine',
    color: '#7C3AED',
  },
  {
    key: 'Handyman',
    title: 'handyman',
    article: 'a',
    search: 'handyman near me',
    tips: ['Good for small jobs that do not need a licensed trade. Gas, wiring and plumbing beyond simple fixes should go to a licensed pro.'],
    icon: 'hammer-wrench',
    color: '#1F8A63',
  },
  {
    key: 'Landscaper',
    title: 'landscaper',
    article: 'a',
    search: 'landscaping service near me',
    tips: ['Ask if irrigation repair and winterizing are something they do.'],
    icon: 'tree',
    color: '#15803D',
  },
  {
    key: 'Pest control',
    title: 'pest control company',
    article: 'a',
    search: 'pest control near me',
    tips: ['Ask what they use and whether it is safe around kids and pets.'],
    icon: 'bug',
    color: '#B45309',
  },
];

export const TRADES = TRADE_INFO.map((t) => t.key);

export function tradeInfo(key: string): TradeInfo | undefined {
  return TRADE_INFO.find((t) => t.key === key);
}

/** Things worth checking before hiring any pro. */
export const HIRING_TIPS = [
  'Licensed and insured. Ask for the license number and check it with your state contractor board.',
  'Recent reviews on Google or Yelp, and how they answered the bad ones.',
  'A written estimate before work starts.',
  'A warranty on their work, and how long it lasts.',
];

/** Which kind of pro a job calls for, matched on the task title. First match wins. */
const RULES: [RegExp, string][] = [
  [/brake|transmission|coolant|\boil\b|tire|battery|wiper|engine|cabin/i, 'Mechanic'],
  [/water heater|relief valve|anode|descale|tankless|softener|leak|sink/i, 'Plumber'],
  [/furnace|\bAC\b|condenser|condensate|heat pump|mini split|swamp|cooler|tune-up|hvac/i, 'HVAC'],
  [/roof|gutter/i, 'Roofer'],
  [/range|dryer|washer|dishwasher|refrigerator|hood/i, 'Appliance repair'],
  [/breaker|outlet|wiring|electrical/i, 'Electrician'],
  [/caulk/i, 'Handyman'],
];

export function tradeFor(title: string): string | undefined {
  for (const [re, trade] of RULES) if (re.test(title)) return trade;
  return undefined;
}

/** Jobs that people search for by name rather than by trade. */
const SEARCHES: [RegExp, string][] = [
  [/swamp|cooler pad/i, 'swamp cooler service near me'],
  [/dryer vent/i, 'dryer vent cleaning near me'],
  [/gutter/i, 'gutter cleaning near me'],
  [/water heater|anode|relief valve/i, 'water heater service near me'],
  [/tankless|descale/i, 'tankless water heater service near me'],
  [/brake/i, 'brake repair near me'],
  [/transmission/i, 'transmission service near me'],
  [/tire|rotate/i, 'tire shop near me'],
  [/\boil\b/i, 'oil change near me'],
  [/gas line|gas connector/i, 'licensed plumber gas line inspection near me'],
  [/chimney/i, 'chimney sweep near me'],
];

/** What to type into Google to find help with a job. */
export function searchFor(title: string, trade?: string): string | undefined {
  for (const [re, q] of SEARCHES) if (re.test(title)) return q;
  const info = trade ? tradeInfo(trade) : undefined;
  return info?.search ?? (trade ? `${trade} near me` : undefined);
}

export function googleUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/** Digits and a leading plus only, ready for a tel: link. */
export function dialable(phone: string): string {
  const trimmed = phone.trim();
  return (trimmed.startsWith('+') ? '+' : '') + trimmed.replace(/\D/g, '');
}

/** Adds https:// when a website was typed without it. */
export function webUrl(site: string): string {
  const s = site.trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

/** "JD" for "Jane Doe", "SG" for "Sal's Garage". */
export function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]).toUpperCase();
}
