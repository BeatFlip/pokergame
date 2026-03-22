import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DbGameState, DbPlayer, DbRoom, GameState, Player, Room } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format chip count with thousands separator */
export function formatChips(amount: number): string {
  return amount.toLocaleString("en-US");
}

/** Format a chip delta as "+1,000" or "-500" */
export function formatChipDelta(delta: number): string {
  const formatted = formatChips(Math.abs(delta));
  return delta >= 0 ? `+${formatted}` : `-${formatted}`;
}

// ── DB → App type mappers ────────────────────────────────────

export function mapDbRoom(db: DbRoom): Room {
  // DB stores settings in snake_case; map to camelCase for the app
  const raw = db.settings as unknown as Record<string, unknown>;
  return {
    id: db.id,
    code: db.code,
    name: db.name,
    status: db.status,
    hostId: db.host_id,
    settings: {
      smallBlind: (raw?.small_blind as number) ?? (raw?.smallBlind as number) ?? 10,
      bigBlind: (raw?.big_blind as number) ?? (raw?.bigBlind as number) ?? 20,
      startingChips: (raw?.starting_chips as number) ?? (raw?.startingChips as number) ?? 1000,
      maxPlayers: (raw?.max_players as number) ?? (raw?.maxPlayers as number) ?? 9,
      turnTimeoutSeconds: (raw?.turn_timeout_seconds as number) ?? (raw?.turnTimeoutSeconds as number) ?? 30,
    },
    createdAt: db.created_at,
  };
}

export function mapDbPlayer(db: DbPlayer): Player {
  return {
    id: db.id,
    roomId: db.room_id,
    name: db.name,
    phoneNumber: db.phone_number,
    seatPosition: db.seat_position,
    chipCount: db.chip_count,
    status: db.status,
    isHost: db.is_host,
    joinedAt: db.joined_at,
    leftAt: db.left_at,
  };
}

export function mapDbGameState(db: DbGameState): GameState {
  // DB stores pot as {main, side_pots} (snake_case JSON)
  const rawPot = db.pot as unknown as {
    main: number;
    side_pots?: Array<{ amount: number; eligible_player_ids?: number[] }>;
  };
  return {
    id: db.id,
    roomId: db.room_id,
    phase: db.phase,
    communityCards: db.community_cards ?? [],
    pot: {
      main: rawPot?.main ?? 0,
      sidePots: (rawPot?.side_pots ?? []).map((sp) => ({
        amount: sp.amount,
        eligiblePlayerIds: sp.eligible_player_ids ?? [],
      })),
    },
    currentTurnPlayerId: db.current_turn_player_id,
    smallBlind: db.small_blind,
    bigBlind: db.big_blind,
    dealerPosition: db.dealer_position,
    roundNumber: db.round_number,
    lastAggressorId: db.last_aggressor_id,
    updatedAt: db.updated_at,
  };
}

/** Seconds remaining in the current player's turn */
export function getTurnSecondsRemaining(
  updatedAt: string,
  timeoutSeconds: number
): number {
  const elapsed = (Date.now() - new Date(updatedAt).getTime()) / 1000;
  return Math.max(0, timeoutSeconds - elapsed);
}

/** Generate a UUID v4 (for session tokens) */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Suit symbol for display */
export const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

/** Whether suit is red */
export function isRedSuit(suit: string): boolean {
  return suit === "hearts" || suit === "diamonds";
}
