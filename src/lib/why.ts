/**
 * A short, plain reason each job is worth doing. Shown on the task screen so a
 * reminder comes with its own motivation. First match wins, so specific
 * patterns go before general ones. Custom tasks with no match show nothing.
 */
const RULES: [RegExp, string][] = [
  // Vehicles
  [/\boil\b/i, 'Oil breaks down and picks up dirt as you drive. Fresh oil keeps engine parts lubricated and cool. Skipping changes speeds up wear and can lead to engine damage that costs far more than the oil.'],
  [/tire pressure/i, 'Tires lose air slowly and drop more when it gets cold. Low pressure hurts braking and handling, wastes fuel and wears the tires out faster.'],
  [/rotate tires/i, 'Tires wear differently depending on where they sit on the vehicle. Rotating them evens out the wear so the whole set lasts longer and handles predictably.'],
  [/engine air filter/i, 'The engine needs clean air to run well. A clogged filter restricts airflow and a damaged one lets dirt into the engine.'],
  [/cabin air filter/i, 'This filter cleans the air you breathe in the cabin. When it clogs, less air comes through the vents and the heat, AC and defrost have to work harder.'],
  [/brake fluid/i, 'Brake fluid absorbs moisture over time. That lowers its boiling point and can corrode brake parts from the inside, so the pedal may not feel right when you need it most.'],
  [/brake/i, 'Worn pads take longer to stop the vehicle and can chew into the rotors. Catching them early keeps a cheap pad job from turning into a much bigger repair.'],
  [/wiper/i, 'Worn blades streak and skip, which cuts visibility in rain right when you need it. They are cheap and take minutes to swap.'],
  [/test battery/i, 'Batteries often fail with little warning, especially in extreme heat or cold. A quick test catches a weak one before it leaves you stranded.'],
  [/transmission/i, 'Transmission fluid wears out with heat and use. Fresh fluid helps it shift smoothly and protects one of the most expensive parts of the vehicle.'],
  [/coolant/i, 'The additives in coolant that prevent corrosion wear out. Old coolant lets rust and scale build up and raises the risk of overheating.'],
  [/registration/i, 'Renewing on time avoids late fees and tickets.'],

  // Safety around the house
  [/alarm batter/i, 'Dead or missing batteries are a common reason alarms fail to sound. Swapping them on a schedule means you never have to wonder.'],
  [/smoke|co alarm/i, 'Alarms only help if they work. A quick press of the test button confirms they will sound when it counts.'],
  [/extinguisher/i, 'An extinguisher that has lost pressure will not work in a fire. Check that the gauge is in the green and that nothing is damaged or blocked.'],
  [/gas line/i, 'A kinked, corroded or loose gas connector can leak. A quick look is cheap safety. If you ever smell gas, leave the house and call your gas utility.'],
  [/burner and vent/i, 'A gas water heater has to vent its exhaust outside, including carbon monoxide. A clear vent and a clean burner keep it running safely.'],
  [/gas furnace/i, 'A yearly check catches small problems before the coldest week of the year. On a gas furnace it also confirms the burner and venting are working safely.'],

  // Cooling and heating
  [/cooler pad/i, 'Old pads clog with mineral scale, cool poorly and can start to smell. New pads bring back airflow and cooling.'],
  [/winterize/i, 'Water left in the pan and supply line can freeze and crack them. Draining and covering the cooler also keeps cold air and debris out of the house.'],
  [/start up swamp/i, 'A clean pan and a working pump, belt and float prevent leaks, weak cooling and a breakdown in the middle of summer.'],
  [/condenser/i, 'Dirty coils cannot shed heat, so the system runs longer to do the same job and costs more to run.'],
  [/condensate/i, 'A clogged drain line can back up and cause water damage, or trip a safety switch that shuts the system off.'],
  [/mini split filter|furnace filter|air filter/i, 'A dirty filter restricts airflow. The system works harder, energy bills go up and the equipment can wear out sooner.'],
  [/tune-up|inspection|deep clean mini split/i, 'A yearly check catches small problems before they turn into a breakdown during the hottest or coldest week of the year.'],
  [/heat pump/i, 'Leaves and debris around the outdoor unit block airflow and make it work harder than it should.'],

  // Kitchen and laundry
  [/hood filter/i, 'Grease builds up in the filter, cuts airflow and is a fire hazard over the stove.'],
  [/burner ports/i, 'Clogged ports cause uneven flames and burners that are slow to light.'],
  [/drip pans/i, 'Built-up spills smoke and smell when the burner heats. A damaged element heats unevenly and should be replaced.'],
  [/dryer vent/i, 'Lint that gets past the screen collects in the duct. It makes drying take longer and is a known fire hazard.'],
  [/lint screen/i, 'Residue from dryer sheets and softener can coat the screen so air cannot pass even when it looks clean.'],
  [/refrigerator coils/i, 'Dust on the coils makes the compressor work harder, which uses more power and wears it out sooner.'],
  [/water filter/i, 'An old filter stops filtering well and slows the water flow.'],
  [/dishwasher/i, 'Food trapped in the filter causes odors and leaves grit on dishes.'],
  [/washer cleaning/i, 'A cleaning cycle clears out detergent residue and the moisture that leads to odor and mold.'],
  [/washer hoses/i, 'A burst supply hose can flood a room quickly. Look for bulges, cracks and rust at the fittings.'],

  // Water
  [/relief valve/i, 'This valve is the safety device that releases pressure if the tank overheats. Testing it confirms it is not stuck.'],
  [/anode/i, 'The anode rod corrodes so the tank does not. Once the rod is used up, the tank itself starts to rust.'],
  [/descale/i, 'Mineral scale builds up inside a tankless heater, cutting flow and efficiency.'],
  [/inlet filter/i, 'A clogged inlet filter restricts water flow to the heater.'],
  [/flush water heater/i, 'Sediment settles at the bottom of the tank. It makes the heater less efficient and can shorten its life.'],
  [/softener/i, 'Without salt the softener stops softening, and hard water goes back to leaving scale in pipes and appliances.'],
  [/leak|sink/i, 'Slow leaks damage cabinets and floors and lead to mold. Catching one early is usually a cheap fix.'],

  // Outside and structure
  [/gutter/i, 'Clogged gutters overflow and send water against the roof edge, siding and foundation, where it causes rot and leaks.'],
  [/roof/i, 'Spotting cracked or missing shingles and damaged flashing early prevents leaks and the interior water damage that follows.'],
  [/caulk/i, 'Failed caulk lets water get behind tile and into walls, which leads to mold and rot. Gaps around windows also let drafts in.'],
];

export function whyItMatters(title: string): string | undefined {
  for (const [re, text] of RULES) if (re.test(title)) return text;
  return undefined;
}
