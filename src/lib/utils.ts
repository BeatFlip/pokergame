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
  return {
    id: db.id,
    code: db.code,
    name: db.name,
    status: db.status,
    hostId: db.host_id,
    settings: db.settings,
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
  return {
    id: db.id,
    roomId: db.room_id,
    phase: db.phase,
    communityCards: db.community_cards,
    pot: db.pot,
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
