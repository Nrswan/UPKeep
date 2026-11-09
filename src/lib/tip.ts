/**
 * The "Tip the developer" card in Settings.
 *
 * Add payment links here and they show up as buttons. With the list empty the
 * card shows a short thank-you and no buttons.
 *
 * Before adding links, check the current App Store and Google Play payment
 * rules. Apple has rejected apps for outside tip links and expects tips to go
 * through in-app purchase.
 */
export const DEVELOPER_NAME = 'Nick Swanson';

export type TipLink = { label: string; url: string };

export const TIP_LINKS: TipLink[] = [
  // { label: 'Venmo', url: 'https://venmo.com/your-handle' },
  // { label: 'PayPal', url: 'https://paypal.me/your-handle' },
];
