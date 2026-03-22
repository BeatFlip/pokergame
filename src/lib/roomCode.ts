// Avoids visually ambiguous characters (0/O, 1/I)
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(): string {
  return Array.from(
    { length: 6 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-HJ-NP-Z2-9]{6}$/.test(code);
}
