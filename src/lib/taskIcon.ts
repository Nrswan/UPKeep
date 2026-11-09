import type { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;
export type TaskIcon = { name: IconName; color: string };

/** First keyword found in the task title wins, so more specific words go first. */
const RULES: [RegExp, IconName, string][] = [
  [/swamp|cooler pad/i, 'snowflake', '#0E7490'],
  [/dishwasher/i, 'dishwasher', '#1D4ED8'],
  [/washer/i, 'washing-machine', '#0F766E'],
  [/softener/i, 'water-opacity', '#4338CA'],
  [/condenser|\bAC\b|mini split|heat pump/i, 'air-conditioner', '#0E7490'],
  [/leak|sink/i, 'pipe', '#0369A1'],
  [/oil/i, 'oil', '#C2410C'],
  [/tire pressure/i, 'car-tire-alert', '#475569'],
  [/tire/i, 'tire', '#475569'],
  [/cabin|hvac|air filter|furnace filter/i, 'air-filter', '#0E7490'],
  [/furnace/i, 'fire', '#C2410C'],
  [/brake fluid/i, 'car-brake-fluid-level', '#B91C1C'],
  [/brake/i, 'car-brake-alert', '#B91C1C'],
  [/wiper/i, 'wiper', '#1D4ED8'],
  [/battery|batteries/i, 'car-battery', '#15803D'],
  [/transmission/i, 'car-shift-pattern', '#7C3AED'],
  [/coolant/i, 'car-coolant-level', '#0369A1'],
  [/registration|insurance|inspection/i, 'file-document-outline', '#6D28D9'],
  [/smoke|alarm/i, 'smoke-detector', '#DC2626'],
  [/extinguisher/i, 'fire-extinguisher', '#DC2626'],
  [/gutter/i, 'weather-pouring', '#0369A1'],
  [/water heater/i, 'water-boiler', '#C2410C'],
  [/dryer/i, 'tumble-dryer', '#7C3AED'],
  [/heating|cooling|a\/c|air condition/i, 'air-conditioner', '#0E7490'],
  [/refrigerator|fridge/i, 'fridge', '#0369A1'],
  [/range|stove|oven/i, 'stove', '#B45309'],
  [/roof/i, 'home-roof', '#92400E'],
  [/caulk|tub|window/i, 'shower', '#0E7490'],
  [/water|filter/i, 'water', '#0369A1'],
  [/engine/i, 'engine', '#475569'],
];

export function taskIcon(title: string, kind: 'home' | 'vehicle'): TaskIcon {
  for (const [re, name, color] of RULES) if (re.test(title)) return { name, color };
  return kind === 'vehicle' ? { name: 'car-cog', color: '#1E6FB8' } : { name: 'wrench', color: '#1F8A63' };
}
