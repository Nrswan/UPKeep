/**
 * Plain questions and "how to tell" guides for the home setup steps, for
 * people who are not sure what kind of appliance they have.
 *
 * These are general rules of thumb. The rating plate (the sticker with the
 * model number) is the surest way to tell, so every guide points to it.
 */
export type Sign = { option: string; title: string; signs: string[] };

export type Question = {
  /** Category key from lib/appliances.ts. */
  category: string;
  question: string;
  /** Short line under the question. */
  help: string;
  /** True when a home can have more than one type, like a swamp cooler and refrigerated air. */
  multi: boolean;
  /** Empty for appliances that only come in one type. */
  guide: Sign[];
  /** Checks that work for every type. */
  tips: string[];
  /** A safety line shown with the guide. */
  safety?: string;
};

const GAS_SAFETY = 'You only need to look. Do not open panels or touch gas valves. If you ever smell gas, leave the house and call the gas company from outside.';

export const QUESTIONS: Question[] = [
  {
    category: 'cooling',
    question: 'How does your home stay cool?',
    help: 'Pick every type you have. Many homes in dry climates have both.',
    multi: true,
    guide: [
      {
        option: 'swamp',
        title: 'Swamp cooler (evaporative)',
        signs: [
          'A metal box on the roof, on the ground or in a window, with pads on its sides',
          'A small water line runs to it',
          'The air feels cool and a little damp, and works best with a window cracked open',
          'A wall switch with settings like Pump, Low and High',
        ],
      },
      {
        option: 'refrigerated',
        title: 'Refrigerated air (central AC)',
        signs: [
          'A metal unit outside on the ground with a fan on top and thin metal fins on the sides',
          'Two copper lines run from that unit into the house',
          'Your thermostat has a Cool setting and the air feels dry and cold',
        ],
      },
      {
        option: 'minisplit',
        title: 'Mini split',
        signs: ['Long white units mounted high on inside walls', 'You run them with a remote', 'A small outdoor unit connected by a line set'],
      },
    ],
    tips: ['Ask the seller, landlord or a neighbor with the same style of house. Homes on one street were often built with the same system.'],
  },
  {
    category: 'heating',
    question: 'How is your home heated?',
    help: 'Pick every type you have. Some homes use a heat pump with a gas furnace as backup.',
    multi: true,
    guide: [
      {
        option: 'gas',
        title: 'Gas furnace',
        signs: [
          'A metal pipe (the vent) goes from the top of the furnace up through the roof or wall',
          'A gas pipe with a shutoff valve connects to it',
          'You may see a small blue flame through a little window when it runs',
          'Your gas bill goes up a lot in winter',
        ],
      },
      {
        option: 'electric',
        title: 'Electric furnace',
        signs: [
          'No vent pipe and no gas pipe on the furnace',
          'Thick electrical wiring goes into it',
          'Your electric bill goes up a lot in winter',
        ],
      },
      {
        option: 'heatpump',
        title: 'Heat pump',
        signs: [
          'The outdoor unit that looks like an AC also runs in winter',
          'Your thermostat has a setting like Em Heat or Aux Heat',
          'The rating plate on the outdoor unit says heat pump',
        ],
      },
    ],
    tips: ['The furnace is usually in a closet, attic, basement or garage. Look for the rating plate on the inside of the front panel door.'],
    safety: GAS_SAFETY,
  },
  {
    category: 'waterheater',
    question: 'What kind of water heater do you have?',
    help: 'It is usually in the garage, a closet, the basement or the attic.',
    multi: false,
    guide: [
      {
        option: 'gas',
        title: 'Gas tank',
        signs: [
          'A metal vent pipe comes out of the top of the tank',
          'A gas pipe with a shutoff valve goes into a control box near the bottom',
          'The control knob has settings like Pilot, On and Off',
          'The sticker lists BTU',
        ],
      },
      {
        option: 'electric',
        title: 'Electric tank',
        signs: [
          'No vent pipe on top',
          'A thick electrical cable goes into the top of the tank',
          'One or two small square cover plates on the side of the tank',
          'The sticker lists watts and volts, and it has its own large breaker',
        ],
      },
      {
        option: 'tankless',
        title: 'Tankless',
        signs: ['No big tank. A box about the size of a suitcase hangs on a wall', 'Hot water never runs out during long showers'],
      },
    ],
    tips: ['The sticker on the side of the tank is the surest way to tell. Take a photo of it so you have the model number later.'],
    safety: GAS_SAFETY,
  },
  {
    category: 'range',
    question: 'Is your range gas or electric?',
    help: 'Go by the cooktop. That is where the upkeep is different.',
    multi: false,
    guide: [
      {
        option: 'gas',
        title: 'Gas',
        signs: [
          'You see a real flame when a burner is on',
          'Heavy metal grates sit over the burners',
          'It clicks when you turn a knob to light it',
          'Behind the range there is a gas pipe and an ordinary wall outlet',
        ],
      },
      {
        option: 'electric',
        title: 'Electric',
        signs: [
          'Metal coils, or a smooth glass top that glows red when on',
          'No flame and no clicking',
          'It plugs into a large heavy duty outlet behind the range',
          'Induction cooktops count as electric',
        ],
      },
    ],
    tips: ['Look for the sticker inside the oven door frame or under the cooktop. It says gas or electric.'],
    safety: GAS_SAFETY,
  },
  {
    category: 'dryer',
    question: 'Is your dryer gas or electric?',
    help: 'Look behind the dryer. It usually takes a few seconds.',
    multi: false,
    guide: [
      {
        option: 'gas',
        title: 'Gas',
        signs: [
          'A metal gas pipe with a shutoff valve connects to the back',
          'It plugs into an ordinary wall outlet',
          'The model number often has a G in it',
        ],
      },
      {
        option: 'electric',
        title: 'Electric',
        signs: [
          'No gas pipe',
          'A thick cord goes into a large three or four slot outlet',
          'The model number often has an E in it',
        ],
      },
    ],
    tips: ['The sticker inside the door or on the back says gas or electric.'],
    safety: GAS_SAFETY,
  },
  { category: 'fridge', question: 'Do you have a refrigerator?', help: 'Count the main one. Add a garage fridge later if you have one.', multi: false, guide: [], tips: [] },
  { category: 'dishwasher', question: 'Do you have a dishwasher?', help: '', multi: false, guide: [], tips: [] },
  { category: 'washer', question: 'Do you have a clothes washer?', help: '', multi: false, guide: [], tips: [] },
  {
    category: 'softener',
    question: 'Do you have a water softener?',
    help: 'Usually a tall tank and a salt bin next to each other, near the water heater or in the garage.',
    multi: false,
    guide: [],
    tips: [],
  },
];

export function questionFor(category: string): Question | undefined {
  return QUESTIONS.find((q) => q.category === category);
}
