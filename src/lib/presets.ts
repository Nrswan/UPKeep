import type { AssetKind } from './types';

export type Preset = {
  title: string;
  everyMonths?: number;
  everyMiles?: number;
  note?: string;
  /** Only applies to vehicles with a combustion engine. */
  engine?: boolean;
};

/**
 * Starter schedules. These are common rules of thumb, not manufacturer specs.
 * Every interval can be changed in the app.
 */
export const PRESETS: Record<AssetKind, Preset[]> = {
  // Appliance upkeep is not here. It comes from lib/appliances.ts based on what the home has.
  home: [
    { title: 'Test smoke and CO alarms', everyMonths: 1 },
    { title: 'Replace smoke alarm batteries', everyMonths: 12 },
    { title: 'Clean gutters', everyMonths: 6 },
    { title: 'Check fire extinguisher', everyMonths: 12 },
    { title: 'Inspect roof', everyMonths: 12 },
    { title: 'Check caulk around tubs and windows', everyMonths: 12 },
    { title: 'Check under sinks for leaks', everyMonths: 6 },
  ],
  vehicle: [
    { title: 'Oil and filter change', everyMonths: 6, everyMiles: 5000, engine: true },
    { title: 'Rotate tires', everyMonths: 6, everyMiles: 6000 },
    { title: 'Check tire pressure', everyMonths: 1 },
    { title: 'Replace engine air filter', everyMonths: 12, everyMiles: 15000, engine: true },
    { title: 'Replace cabin air filter', everyMonths: 12, everyMiles: 15000 },
    { title: 'Inspect brakes', everyMonths: 12, everyMiles: 12000 },
    { title: 'Replace wiper blades', everyMonths: 12 },
    { title: 'Test battery', everyMonths: 12 },
    { title: 'Change brake fluid', everyMonths: 24, everyMiles: 30000 },
    { title: 'Change transmission fluid', everyMonths: 48, everyMiles: 50000, engine: true },
    { title: 'Flush coolant', everyMonths: 60, everyMiles: 60000 },
    { title: 'Renew registration', everyMonths: 12 },
  ],
};

/** Makes that only sell battery electric vehicles. Engine tasks start switched off for these. */
export const ELECTRIC_MAKES = ['Tesla', 'Rivian', 'Lucid', 'Polestar'];
