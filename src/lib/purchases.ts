import type { AssetKind, Purchase, Spec } from './types';

/**
 * Kinds of things people buy over and over for a home or vehicle, and the
 * details that matter when buying the same one again. A paint color without
 * its code and sheen, or a bulb without its base and color temperature, is
 * hard to match at the store.
 */
export type PurchaseCategory = {
  key: string;
  label: string;
  icon: string;
  color: string;
  /** Placeholder for "What is it?" */
  example: string;
  fields: string[];
};

export const PURCHASE_CATEGORIES: Record<AssetKind, PurchaseCategory[]> = {
  home: [
    { key: 'paint', label: 'Paint', icon: 'format-paint', color: '#B45309', example: 'Living room walls', fields: ['Color name', 'Color code', 'Sheen', 'Room or area'] },
    { key: 'flooring', label: 'Flooring', icon: 'floor-plan', color: '#92400E', example: 'Hallway vinyl plank', fields: ['Product or style', 'Color', 'Size', 'Room or area', 'Boxes left over'] },
    { key: 'bulbs', label: 'Lightbulbs', icon: 'lightbulb-on-outline', color: '#CA8A04', example: 'Kitchen can lights', fields: ['Base type', 'Wattage', 'Color temperature', 'Where used'] },
    { key: 'filters', label: 'Air filters', icon: 'air-filter', color: '#0E7490', example: 'Furnace filter', fields: ['Size', 'Rating', 'Where used'] },
    { key: 'batteries', label: 'Batteries', icon: 'battery-outline', color: '#15803D', example: 'Smoke alarms', fields: ['Size', 'Where used'] },
    { key: 'tile', label: 'Tile', icon: 'checkerboard', color: '#0369A1', example: 'Shower walls', fields: ['Product or style', 'Color', 'Size', 'Grout color', 'Room or area'] },
    { key: 'fixtures', label: 'Fixtures and hardware', icon: 'faucet', color: '#475569', example: 'Bathroom faucet', fields: ['Model number', 'Finish', 'Room or area'] },
    { key: 'supplies', label: 'Supplies', icon: 'spray-bottle', color: '#7C3AED', example: 'Swamp cooler pads', fields: ['Size', 'Where used'] },
  ],
  vehicle: [
    { key: 'tires', label: 'Tires', icon: 'tire', color: '#475569', example: 'All season tires', fields: ['Size', 'Model', 'Load and speed rating'] },
    { key: 'fluids', label: 'Oil and fluids', icon: 'oil', color: '#C2410C', example: 'Engine oil', fields: ['Type', 'Weight or spec', 'Capacity'] },
    { key: 'wipers', label: 'Wiper blades', icon: 'wiper', color: '#1D4ED8', example: 'Front wipers', fields: ['Driver size', 'Passenger size', 'Rear size'] },
    { key: 'vbulbs', label: 'Bulbs', icon: 'car-light-high', color: '#CA8A04', example: 'Headlights', fields: ['Bulb number', 'Where used'] },
    { key: 'vfilters', label: 'Filters', icon: 'air-filter', color: '#0E7490', example: 'Cabin air filter', fields: ['Part number', 'Which filter'] },
    { key: 'vbattery', label: 'Battery', icon: 'car-battery', color: '#15803D', example: 'Battery', fields: ['Group size', 'Model'] },
    { key: 'parts', label: 'Parts', icon: 'cog-outline', color: '#7C3AED', example: 'Serpentine belt', fields: ['Part number'] },
  ],
};

export const OTHER_CATEGORY: PurchaseCategory = { key: 'other', label: 'Other', icon: 'tag-outline', color: '#64748B', example: 'What you bought', fields: [] };

export function purchaseCategory(key: string): PurchaseCategory {
  for (const list of Object.values(PURCHASE_CATEGORIES)) {
    const c = list.find((x) => x.key === key);
    if (c) return c;
  }
  return OTHER_CATEGORY;
}

/** "Agreeable Gray  ·  SW 7029  ·  Eggshell" from the first few filled details. */
export function purchaseSummary(p: Pick<Purchase, 'specs'>, max = 3): string {
  return p.specs
    .filter((s) => s.value.trim())
    .slice(0, max)
    .map((s) => s.value.trim())
    .join('  ·  ');
}

/** Search text for buying the same thing again. Includes the store when known. */
export function buyAgainQuery(p: Pick<Purchase, 'brand' | 'name' | 'specs' | 'store' | 'category'>): string {
  const cat = purchaseCategory(p.category);
  const firstSpec = (label: string) => p.specs.find((s) => s.label === label && s.value.trim())?.value.trim();
  // The detail that names the product best for each kind of purchase.
  const key =
    firstSpec('Color name') ??
    firstSpec('Product or style') ??
    firstSpec('Model number') ??
    firstSpec('Part number') ??
    firstSpec('Model') ??
    firstSpec('Bulb number') ??
    firstSpec('Size');
  const parts = [p.brand?.trim(), key ?? p.name.trim()];
  if (cat.key === 'paint' && firstSpec('Color code')) parts.push(firstSpec('Color code'));
  if (cat.key !== 'other' && !key) parts.push(cat.label.toLowerCase());
  if (p.store?.trim()) parts.push(p.store.trim());
  return parts.filter(Boolean).join(' ');
}

/** True when any of the words typed appear somewhere in the purchase. */
export function matchesPurchase(p: Purchase, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [p.name, p.brand, p.store, p.note, purchaseCategory(p.category).label, ...p.specs.flatMap((s: Spec) => [s.label, s.value])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return words.every((w) => hay.includes(w));
}
