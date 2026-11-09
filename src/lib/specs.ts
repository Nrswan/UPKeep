import type { Spec } from './types';

/**
 * Suggested "parts and specs" fields for a task, picked from its title. These
 * are the details people stand in a store aisle trying to remember: oil weight,
 * filter number, pad size. Users can add their own fields too.
 */
const RULES: [RegExp, string[]][] = [
  [/oil/i, ['Oil weight', 'Oil type', 'Oil capacity', 'Oil filter']],
  [/tire pressure/i, ['Front pressure (psi)', 'Rear pressure (psi)']],
  [/tire/i, ['Tire size', 'Lug nut torque']],
  [/cooler pad/i, ['Pad size', 'Number of pads']],
  [/water filter/i, ['Filter part number']],
  [/engine air filter|cabin air filter/i, ['Filter part number']],
  [/filter/i, ['Filter size', 'Filter rating']],
  [/wiper/i, ['Driver blade size', 'Passenger blade size', 'Rear blade size']],
  [/alarm batter/i, ['Battery type', 'Number of alarms']],
  [/battery/i, ['Battery group size', 'Battery installed']],
  [/brake fluid/i, ['Fluid type']],
  [/brake/i, ['Front pad part number', 'Rear pad part number']],
  [/transmission/i, ['Fluid type', 'Fluid capacity']],
  [/coolant/i, ['Coolant type', 'Coolant capacity']],
  [/anode/i, ['Anode rod type']],
  [/water heater/i, ['Tank size']],
  [/softener/i, ['Salt type']],
  [/swamp cooler/i, ['Belt size', 'Pump model']],
  [/extinguisher/i, ['Expiration date']],
  [/registration/i, ['Plate number']],
];

export function suggestedSpecLabels(title: string): string[] {
  for (const [re, labels] of RULES) if (re.test(title)) return labels;
  return [];
}

/** Suggested fields first, filled from what is saved, then any extra saved fields. */
export function specRows(title: string, saved: Spec[] = []): Spec[] {
  const byLabel = new Map(saved.map((s) => [s.label.toLowerCase(), s.value]));
  const suggested = suggestedSpecLabels(title);
  const rows: Spec[] = suggested.map((label) => ({ label, value: byLabel.get(label.toLowerCase()) ?? '' }));
  const known = new Set(suggested.map((l) => l.toLowerCase()));
  for (const s of saved) if (!known.has(s.label.toLowerCase())) rows.push({ ...s });
  return rows;
}

/** Drops blank rows and trims the rest. */
export function cleanSpecs(rows: Spec[]): Spec[] {
  return rows
    .map((r) => ({ label: r.label.trim(), value: r.value.trim() }))
    .filter((r) => r.label && r.value);
}
