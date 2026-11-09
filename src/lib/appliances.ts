import type { MaterialCommunityIcons } from '@expo/vector-icons';

import type { Preset } from './presets';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type ApplianceOption = {
  key: string;
  /** Used as the appliance's default name, so it reads well alone: "Gas range". */
  label: string;
  /** Short text for the choice chip: "Gas". */
  chip: string;
  tasks: Preset[];
};

export type ApplianceCategory = {
  key: string;
  label: string;
  icon: IconName;
  color: string;
  options: ApplianceOption[];
};

/**
 * What a home can have and the upkeep each type needs. The type matters: a
 * swamp cooler and refrigerated air share almost no maintenance, and gas
 * appliances have checks that electric ones do not.
 *
 * Intervals are common rules of thumb. Every one can be changed in the app.
 */
export const APPLIANCES: ApplianceCategory[] = [
  {
    key: 'cooling',
    label: 'Cooling',
    icon: 'snowflake',
    color: '#0E7490',
    options: [
      {
        key: 'swamp',
        label: 'Swamp cooler',
        chip: 'Swamp cooler',
        tasks: [
          { title: 'Replace cooler pads', everyMonths: 12 },
          { title: 'Start up swamp cooler: clean pan, check pump, belt and float', everyMonths: 12 },
          { title: 'Winterize swamp cooler: drain, shut off water and cover', everyMonths: 12 },
        ],
      },
      {
        key: 'refrigerated',
        label: 'Refrigerated air',
        chip: 'Refrigerated air',
        tasks: [
          { title: 'Replace AC air filter', everyMonths: 3 },
          { title: 'Clean outdoor condenser coils', everyMonths: 12 },
          { title: 'Clear AC condensate drain line', everyMonths: 12 },
          { title: 'Schedule AC tune-up', everyMonths: 12 },
        ],
      },
      {
        key: 'minisplit',
        label: 'Mini split',
        chip: 'Mini split',
        tasks: [
          { title: 'Clean mini split filters', everyMonths: 2 },
          { title: 'Deep clean mini split coils', everyMonths: 12 },
        ],
      },
    ],
  },
  {
    key: 'heating',
    label: 'Heating',
    icon: 'fire',
    color: '#C2410C',
    options: [
      {
        key: 'gas',
        label: 'Gas furnace',
        chip: 'Gas furnace',
        tasks: [
          { title: 'Replace furnace filter', everyMonths: 3 },
          { title: 'Schedule gas furnace inspection', everyMonths: 12 },
        ],
      },
      {
        key: 'electric',
        label: 'Electric furnace',
        chip: 'Electric furnace',
        tasks: [
          { title: 'Replace furnace filter', everyMonths: 3 },
          { title: 'Schedule furnace inspection', everyMonths: 12 },
        ],
      },
      {
        key: 'heatpump',
        label: 'Heat pump',
        chip: 'Heat pump',
        tasks: [
          { title: 'Replace heat pump air filter', everyMonths: 3 },
          { title: 'Clear debris from outdoor heat pump unit', everyMonths: 6 },
          { title: 'Schedule heat pump tune-up', everyMonths: 12 },
        ],
      },
    ],
  },
  {
    key: 'range',
    label: 'Range',
    icon: 'stove',
    color: '#B45309',
    options: [
      {
        key: 'gas',
        label: 'Gas range',
        chip: 'Gas',
        tasks: [
          { title: 'Clean range burner ports and igniters', everyMonths: 6 },
          { title: 'Check range gas line connector', everyMonths: 12 },
          { title: 'Clean range hood filter', everyMonths: 6 },
        ],
      },
      {
        key: 'electric',
        label: 'Electric range',
        chip: 'Electric',
        tasks: [
          { title: 'Clean range drip pans and check elements', everyMonths: 6 },
          { title: 'Clean range hood filter', everyMonths: 6 },
        ],
      },
    ],
  },
  {
    key: 'dryer',
    label: 'Dryer',
    icon: 'tumble-dryer',
    color: '#7C3AED',
    options: [
      {
        key: 'gas',
        label: 'Gas dryer',
        chip: 'Gas',
        tasks: [
          { title: 'Clean dryer vent duct', everyMonths: 12 },
          { title: 'Wash dryer lint screen and clean its housing', everyMonths: 6 },
          { title: 'Check dryer gas line connector', everyMonths: 12 },
        ],
      },
      {
        key: 'electric',
        label: 'Electric dryer',
        chip: 'Electric',
        tasks: [
          { title: 'Clean dryer vent duct', everyMonths: 12 },
          { title: 'Wash dryer lint screen and clean its housing', everyMonths: 6 },
        ],
      },
    ],
  },
  {
    key: 'waterheater',
    label: 'Water heater',
    icon: 'water-boiler',
    color: '#BE123C',
    options: [
      {
        key: 'gas',
        label: 'Gas water heater',
        chip: 'Gas tank',
        tasks: [
          { title: 'Flush water heater', everyMonths: 12 },
          { title: 'Test water heater relief valve', everyMonths: 12 },
          { title: 'Check water heater anode rod', everyMonths: 36 },
          { title: 'Check water heater burner and vent', everyMonths: 12 },
        ],
      },
      {
        key: 'electric',
        label: 'Electric water heater',
        chip: 'Electric tank',
        tasks: [
          { title: 'Flush water heater', everyMonths: 12 },
          { title: 'Test water heater relief valve', everyMonths: 12 },
          { title: 'Check water heater anode rod', everyMonths: 36 },
        ],
      },
      {
        key: 'tankless',
        label: 'Tankless water heater',
        chip: 'Tankless',
        tasks: [
          { title: 'Descale tankless water heater', everyMonths: 12 },
          { title: 'Clean tankless water heater inlet filter', everyMonths: 12 },
        ],
      },
    ],
  },
  {
    key: 'fridge',
    label: 'Refrigerator',
    icon: 'fridge',
    color: '#0369A1',
    options: [
      {
        key: 'fridge',
        label: 'Refrigerator',
        chip: 'Refrigerator',
        tasks: [
          { title: 'Clean refrigerator coils', everyMonths: 12 },
          { title: 'Replace refrigerator water filter', everyMonths: 6 },
        ],
      },
    ],
  },
  {
    key: 'dishwasher',
    label: 'Dishwasher',
    icon: 'dishwasher',
    color: '#1D4ED8',
    options: [
      {
        key: 'dishwasher',
        label: 'Dishwasher',
        chip: 'Dishwasher',
        tasks: [{ title: 'Clean dishwasher filter', everyMonths: 3 }],
      },
    ],
  },
  {
    key: 'washer',
    label: 'Washer',
    icon: 'washing-machine',
    color: '#0F766E',
    options: [
      {
        key: 'washer',
        label: 'Washer',
        chip: 'Washer',
        tasks: [
          { title: 'Run washer cleaning cycle', everyMonths: 3 },
          { title: 'Inspect washer hoses', everyMonths: 12 },
        ],
      },
    ],
  },
  {
    key: 'softener',
    label: 'Water softener',
    icon: 'water-opacity',
    color: '#4338CA',
    options: [
      {
        key: 'softener',
        label: 'Water softener',
        chip: 'Water softener',
        tasks: [{ title: 'Check water softener salt', everyMonths: 2 }],
      },
    ],
  },
];

export function findCategory(key: string): ApplianceCategory | undefined {
  return APPLIANCES.find((c) => c.key === key);
}

export function findOption(category: string, option: string): ApplianceOption | undefined {
  return findCategory(category)?.options.find((o) => o.key === option);
}

/** Icon and color for an appliance, with a neutral fallback for custom ones. */
export function applianceLook(category: string): { icon: IconName; color: string } {
  const c = findCategory(category);
  return c ? { icon: c.icon, color: c.color } : { icon: 'power-plug', color: '#475569' };
}
