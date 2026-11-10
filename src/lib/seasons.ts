/**
 * Seasonal checklists. These are once-a-season jobs that are easy to forget
 * and do not need a repeating reminder of their own. Seasons follow the
 * Northern Hemisphere calendar.
 */
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export const SEASONS: { key: Season; label: string; months: string; icon: string; colors: readonly [string, string] }[] = [
  { key: 'spring', label: 'Spring', months: 'March to May', icon: 'flower-tulip', colors: ['#3E9B5F', '#1F6F54'] },
  { key: 'summer', label: 'Summer', months: 'June to August', icon: 'white-balance-sunny', colors: ['#E39A1B', '#C2571A'] },
  { key: 'fall', label: 'Fall', months: 'September to November', icon: 'leaf-maple', colors: ['#C8611B', '#8C3A16'] },
  { key: 'winter', label: 'Winter', months: 'December to February', icon: 'snowflake', colors: ['#3C7FC0', '#274B8F'] },
];

/** month is 1 to 12. */
export function seasonForMonth(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/** Key for saved checkmarks. December counts toward the winter that ends the next year. */
export function seasonKey(date: string): string {
  const [y, m] = date.split('-').map(Number);
  const season = seasonForMonth(m);
  return `${season === 'winter' && m === 12 ? y + 1 : y}-${season}`;
}

export type SeasonItem = {
  id: string;
  title: string;
  why: string;
  /** Who it applies to. Appliance needs look like "cooling:swamp". Leave off for every home. */
  needs?: 'vehicle' | `${string}:${string}`;
};

const ITEMS: Record<Season, SeasonItem[]> = {
  spring: [
    { id: 'sp-ac-test', title: 'Run the cooling for a few minutes before the first hot day', why: 'Better to find a problem now than during a heat wave when every tech is booked.' },
    { id: 'sp-swamp', title: 'Start up the swamp cooler', why: 'Clean the pan, check the pads, pump, belt and float, then reconnect the water.', needs: 'cooling:swamp' },
    { id: 'sp-gutters', title: 'Clear gutters and downspouts', why: 'Spring rain needs a clear path away from the house.' },
    { id: 'sp-roof', title: 'Look over the roof from the ground', why: 'Winter wind and weather can lift shingles and loosen flashing.' },
    { id: 'sp-hose', title: 'Turn on outdoor faucets and check for leaks', why: 'A pipe that froze over winter often shows up as a leak the first time you use it.' },
    { id: 'sp-screens', title: 'Check window and door screens', why: 'Small tears let bugs in once windows are open.' },
    { id: 'sp-deck', title: 'Check decks, railings and fences for loose or rotted boards', why: 'Wood moves over winter and a loose railing is a fall risk.' },
    { id: 'sp-car-wash', title: 'Wash the underside of the vehicle', why: 'It rinses off road salt and grime that cause rust.', needs: 'vehicle' },
    { id: 'sp-wipers', title: 'Check wiper blades and washer fluid', why: 'Winter is hard on blades and spring rain is when you need them.', needs: 'vehicle' },
  ],
  summer: [
    { id: 'su-condenser', title: 'Keep two feet clear around the outdoor AC unit', why: 'Plants and debris block the airflow it needs to cool.', needs: 'cooling:refrigerated' },
    { id: 'su-swamp', title: 'Check swamp cooler pads and water level', why: 'Mid-season scale and a low pan are the usual reasons it stops cooling well.', needs: 'cooling:swamp' },
    { id: 'su-caulk', title: 'Check caulk and weatherstripping around windows and doors', why: 'Gaps let cooled air out and hot air in.' },
    { id: 'su-pests', title: 'Look for wasp nests and pest entry points', why: 'Eaves, vents and gaps around pipes are easier to deal with early.' },
    { id: 'su-garage', title: 'Test the garage door auto-reverse', why: 'Put a board flat under the door. It should reverse when it touches it.' },
    { id: 'su-sprinklers', title: 'Check sprinklers for leaks and overspray', why: 'A broken head wastes water and can soak the foundation or siding.' },
    { id: 'su-grill', title: 'Clean the grill and its grease tray', why: 'Built-up grease is what causes flare-ups and grill fires.' },
    { id: 'su-coolant', title: 'Check coolant level and AC in the vehicle', why: 'Heat is when a weak cooling system fails.', needs: 'vehicle' },
    { id: 'su-tires', title: 'Check tire pressure and tread', why: 'Hot pavement is hard on worn or underinflated tires.', needs: 'vehicle' },
  ],
  fall: [
    { id: 'fa-furnace', title: 'Run the heat for a few minutes before the first cold night', why: 'A first-use smell is normal. No heat or odd noises means call for service now.' },
    { id: 'fa-swamp', title: 'Winterize the swamp cooler', why: 'Drain it, shut off and drain the water line and cover the unit before the first freeze.', needs: 'cooling:swamp' },
    { id: 'fa-gutters', title: 'Clear gutters after the leaves drop', why: 'Clogged gutters overflow and can freeze into ice at the roof edge.' },
    { id: 'fa-hoses', title: 'Disconnect and drain garden hoses', why: 'A hose left on can trap water that freezes and splits the faucet or pipe.' },
    { id: 'fa-irrigation', title: 'Shut off and drain the sprinkler system', why: 'Water left in the lines can freeze and crack pipes and valves.' },
    { id: 'fa-alarms', title: 'Test smoke and carbon monoxide alarms', why: 'Heating season is when fire and carbon monoxide risks go up.' },
    { id: 'fa-drafts', title: 'Check weatherstripping and door sweeps', why: 'Sealing drafts is a cheap way to lower the heating bill.' },
    { id: 'fa-chimney', title: 'Have the chimney inspected if you burn wood', why: 'Creosote buildup is a leading cause of chimney fires.' },
    { id: 'fa-battery', title: 'Have the vehicle battery tested', why: 'Cold weather finishes off a weak battery. Most parts stores test for free.', needs: 'vehicle' },
  ],
  winter: [
    { id: 'wi-filter', title: 'Check the furnace filter', why: 'The system runs the most now, so the filter loads up faster.' },
    { id: 'wi-shutoff', title: 'Make sure everyone knows where the main water shutoff is', why: 'If a pipe bursts, shutting the water off fast is what limits the damage.' },
    { id: 'wi-freeze', title: 'On hard freeze nights, open sink cabinets and let faucets drip', why: 'Moving water and warm air help keep pipes on outside walls from freezing.' },
    { id: 'wi-attic', title: 'Look in the attic for damp spots or frost', why: 'They point to a roof leak or poor ventilation before it stains the ceiling.' },
    { id: 'wi-vents', title: 'Keep furnace and dryer vents outside clear of snow', why: 'A blocked exhaust vent can push carbon monoxide back inside.' },
    { id: 'wi-extinguisher', title: 'Check the fire extinguisher gauge', why: 'Space heaters, fireplaces and holiday cooking make this the season it matters most.' },
    { id: 'wi-fridge', title: 'Vacuum the refrigerator coils', why: 'A good indoor job for a cold day, and it helps the fridge run less.' },
    { id: 'wi-car-kit', title: 'Put a blanket, flashlight and scraper in the vehicle', why: 'A small kit matters if you get stuck in cold weather.', needs: 'vehicle' },
    { id: 'wi-tires', title: 'Check tire pressure after a cold snap', why: 'Tires lose pressure as the temperature drops.', needs: 'vehicle' },
  ],
};

export type SeasonContext = { hasVehicle: boolean; appliances: Set<string> };

/** The items for a season that apply to what this user has. */
export function itemsFor(season: Season, ctx: SeasonContext): SeasonItem[] {
  return ITEMS[season].filter((i) => {
    if (!i.needs) return true;
    if (i.needs === 'vehicle') return ctx.hasVehicle;
    return ctx.appliances.has(i.needs);
  });
}

export function allSeasonItems(): SeasonItem[] {
  return (Object.keys(ITEMS) as Season[]).flatMap((s) => ITEMS[s]);
}
