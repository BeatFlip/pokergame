/**
 * Build a Vipps deeplink for a Norwegian phone number.
 * Opens the Vipps app pre-filled with the recipient — user enters amount manually.
 *
 * @param phoneNumber - "+47XXXXXXXX" format (as stored in DB)
 */
export function buildVippsDeeplink(phoneNumber: string): string {
  // Strip leading "+" to get "47XXXXXXXX"
  const digits = phoneNumber.replace(/^\+/, "");
  return `https://qr.vipps.no/28/2/01/031/${digits}?v=1`;
}

/** Norwegian mobile: +47 followed by 4-9 (mobile prefix) then 7 more digits */
export const NORWEGIAN_PHONE_REGEX = /^\+47[2-9]\d{7}$/;

export function isValidNorwegianPhone(phone: string): boolean {
  return NORWEGIAN_PHONE_REGEX.test(phone);
}

/** Format "+47XXXXXXXX" as "+47 XX XX XX XX" for display */
export function formatNorwegianPhone(phone: string): string {
  const digits = phone.replace("+47", "");
  return `+47 ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
}
