import { DEVELOPER_NAME } from './tip';

/**
 * The safety notice and disclaimer shown on first launch and in Settings.
 *
 * This wording is a starting point written in plain language. Have an attorney
 * review it before release. Bump DISCLAIMER_VERSION whenever the text changes
 * in a way users should agree to again.
 */
export const DISCLAIMER_VERSION = 1;

/** One line shown next to maintenance guidance. */
export const SHORT_NOTICE =
  'General guidance only. Follow the manufacturer\'s instructions and hire a licensed professional when you are unsure.';

/** The points shown on the first launch screen. */
export const KEY_POINTS: string[] = [
  'Upkeep gives general reminders and information. It is not professional advice for your home or vehicle.',
  'You are responsible for deciding whether a job is safe for you to do and for doing it safely.',
  'Always follow the manufacturer\'s instructions, your owner\'s manual and local codes. They come first.',
  'When you are unsure, or the job involves gas, electricity, heights or brakes, hire a licensed professional.',
  'You use Upkeep at your own risk. The developer is not liable for damage, injury or loss.',
];

export const DISCLAIMER: { title: string; body: string }[] = [
  {
    title: 'General information only',
    body:
      'Upkeep provides general maintenance reminders, schedules, explanations, difficulty and time estimates and tips for informational purposes only. Nothing in the app is professional advice, including mechanical, electrical, plumbing, gas, HVAC, roofing, construction, safety, legal or financial advice. The app does not know the condition, age, design or history of your home, appliances or vehicle.',
  },
  {
    title: 'Manufacturer instructions and codes come first',
    body:
      'Schedules and intervals in the app are common rules of thumb and are not manufacturer specifications. Always follow the instructions, warnings and maintenance schedule from the manufacturer of your appliance, equipment or vehicle, and all building codes, permits and laws that apply where you live. If anything in the app conflicts with them, follow the manufacturer and the law.',
  },
  {
    title: 'You are responsible for your own safety',
    body:
      'Home and vehicle maintenance can cause property damage, serious injury or death. Hazards include electric shock, gas leaks, carbon monoxide, fire, burns, falls from ladders and roofs, moving parts, pressurized systems and vehicles that are not properly supported. You alone decide whether a task is within your ability. Shut off power, gas and water where it applies, use proper tools and safety gear and never work under a vehicle held up only by a jack. Difficulty labels such as "easy" are general and may not fit your situation.',
  },
  {
    title: 'When to call a professional',
    body:
      'If you are unsure about any task, stop and hire a licensed and insured professional. Work involving gas lines, gas appliances, electrical wiring, roofs, brakes and other safety systems should be done or checked by a qualified professional.',
  },
  {
    title: 'Emergencies',
    body:
      'Upkeep is not an emergency service. If you smell gas, leave the building right away and call your gas utility or 911 from outside. If a carbon monoxide alarm sounds, get everyone to fresh air and call 911. For a fire or a medical emergency, call 911.',
  },
  {
    title: 'Reminders and records',
    body:
      'Reminders depend on your phone, its settings and the information you enter. A reminder may be late or may not arrive. Do not rely on Upkeep as your only way to keep track of safety critical maintenance, warranty deadlines or registration dates. Your data is stored only on your phone and can be lost if the app is deleted or the phone is lost, reset or damaged. Keep your own copies of important receipts and records.',
  },
  {
    title: 'No warranty',
    body:
      'Upkeep is provided "as is" and "as available" without warranties of any kind, express or implied, including warranties of accuracy, merchantability and fitness for a particular purpose. No promise is made that the information in the app is complete, current or right for your home or vehicle.',
  },
  {
    title: 'Limitation of liability',
    body: `To the fullest extent permitted by law, ${DEVELOPER_NAME} and anyone involved in creating or distributing Upkeep are not liable for any property damage, personal injury, death, loss, cost or other damages of any kind arising from your use of the app, from work you or anyone else performs, or from your reliance on anything in the app. You use Upkeep and act on its content entirely at your own risk. Some places do not allow certain limits on liability, so parts of this section may not apply to you.`,
  },
  {
    title: 'Your agreement',
    body:
      'By using Upkeep you confirm that you have read and understood this notice and that you accept these terms. If you do not agree, do not use the app.',
  },
];
