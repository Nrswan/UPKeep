/** Kinds of pros people keep on hand. Users can also type their own. */
export const TRADES = ['HVAC', 'Plumber', 'Electrician', 'Mechanic', 'Roofer', 'Appliance repair', 'Handyman', 'Landscaper', 'Pest control'];

/** Which kind of pro a job calls for, matched on the task title. First match wins. */
const RULES: [RegExp, string][] = [
  [/brake|transmission|coolant|\boil\b|tire|battery|wiper|engine|cabin/i, 'Mechanic'],
  [/water heater|relief valve|anode|descale|tankless|softener|leak|sink/i, 'Plumber'],
  [/furnace|\bAC\b|condenser|condensate|heat pump|mini split|swamp|cooler|tune-up/i, 'HVAC'],
  [/roof|gutter/i, 'Roofer'],
  [/range|dryer|washer|dishwasher|refrigerator|hood/i, 'Appliance repair'],
  [/breaker|outlet|wiring|electrical/i, 'Electrician'],
];

export function tradeFor(title: string): string | undefined {
  for (const [re, trade] of RULES) if (re.test(title)) return trade;
  return undefined;
}

/** Digits and a leading plus only, ready for a tel: link. */
export function dialable(phone: string): string {
  const trimmed = phone.trim();
  return (trimmed.startsWith('+') ? '+' : '') + trimmed.replace(/\D/g, '');
}
