// ── Cards ────────────────────────────────────────────────────

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
  /** Numeric value: 2–14 (Ace = 14) */
  value: number;
}

// ── Hand Evaluation ──────────────────────────────────────────

export enum HandRank {
  HIGH_CARD = 1,
  ONE_PAIR = 2,
  TWO_PAIR = 3,
  THREE_OF_A_KIND = 4,
  STRAIGHT = 5,
  FLUSH = 6,
  FULL_HOUSE = 7,
  FOUR_OF_A_KIND = 8,
  STRAIGHT_FLUSH = 9,
  ROYAL_FLUSH = 10,
}

export const HAND_RANK_NAMES: Record<HandRank, string> = {
  [HandRank.HIGH_CARD]: "High Card",
  [HandRank.ONE_PAIR]: "One Pair",
  [HandRank.TWO_PAIR]: "Two Pair",
  [HandRank.THREE_OF_A_KIND]: "Three of a Kind",
  [HandRank.STRAIGHT]: "Straight",
  [HandRank.FLUSH]: "Flush",
  [HandRank.FULL_HOUSE]: "Full House",
  [HandRank.FOUR_OF_A_KIND]: "Four of a Kind",
  [HandRank.STRAIGHT_FLUSH]: "Straight Flush",
  [HandRank.ROYAL_FLUSH]: "Royal Flush",
};

export interface EvaluatedHand {
  rank: HandRank;
  rankName: string;
  bestFive: Card[];
  /** Descending values for tiebreaking equal-rank hands */
  tiebreakers: number[];
}

// ── Players ──────────────────────────────────────────────────

export type PlayerStatus =
  | "waiting"
  | "active"
  | "folded"
  | "all_in"
  | "sitting_out"
  | "left";

export interface Player {
  id: number;
  roomId: number;
  name: string;
  phoneNumber: string;
  seatPosition: number | null;
  chipCount: number;
  status: PlayerStatus;
  isHost: boolean;
  joinedAt: string;
  leftAt: string | null;
}

export type BettingAction = "fold" | "check" | "call" | "raise" | "all_in";

export interface PlayerHand {
  id: number;
  gameStateId: number;
  playerId: number;
  /** Only populated for the local player — empty for opponents */
  cards: Card[];
  isFolded: boolean;
  isAllIn: boolean;
  currentBet: number;
  totalInvested: number;
  actionTaken: BettingAction | null;
}

// ── Game State ───────────────────────────────────────────────

export type GamePhase =
  | "waiting_for_players"
  | "dealing"
  | "pre_flop"
  | "flop"
  | "turn"
  | "river"
  | "showdown"
  | "settlement";

export interface SidePot {
  amount: number;
  eligiblePlayerIds: number[];
}

export interface Pot {
  main: number;
  sidePots: SidePot[];
}

export interface GameState {
  id: number;
  roomId: number;
  phase: GamePhase;
  communityCards: Card[];
  pot: Pot;
  currentTurnPlayerId: number | null;
  smallBlind: number;
  bigBlind: number;
  dealerPosition: number;
  roundNumber: number;
  lastAggressorId: number | null;
  /** ISO timestamptz — used for turn timer */
  updatedAt: string;
}

// ── Room ─────────────────────────────────────────────────────

export type RoomStatus = "waiting" | "playing" | "finished";

export interface RoomSettings {
  smallBlind: number;
  bigBlind: number;
  startingChips: number;
  maxPlayers: number;
  turnTimeoutSeconds: number;
}

export interface Room {
  id: number;
  code: string;
  name: string;
  status: RoomStatus;
  hostId: number | null;
  settings: RoomSettings;
  createdAt: string;
}

// ── Chat ─────────────────────────────────────────────────────

export interface ChatMessage {
  id: number;
  roomId: number;
  playerId: number | null;
  playerName: string;
  message: string;
  createdAt: string;
}

// ── Settlement ───────────────────────────────────────────────

export interface PlayerBalance {
  playerId: number;
  playerName: string;
  phone: string;
  startingChips: number;
  finalChips: number;
  netBalance: number;
}

export interface Transaction {
  fromPlayerId: number;
  fromName: string;
  toPlayerId: number;
  toName: string;
  toPhone: string;
  amount: number;
}

export interface Settlement {
  id: number;
  roomId: number;
  fromPlayerId: number;
  fromPlayerName: string;
  toPlayerId: number;
  toPlayerName: string;
  toPlayerPhone: string;
  amount: number;
  isPaid: boolean;
  /** Computed client-side from toPlayerPhone */
  vippsUrl: string;
  createdAt: string;
}

// ── API Request / Response ───────────────────────────────────

export interface CreateRoomRequest {
  name: string;
  settings?: Partial<RoomSettings>;
}

export interface CreateRoomResponse {
  room: Room;
}

export interface JoinRoomRequest {
  name: string;
  phoneNumber: string;
}

export interface JoinRoomResponse {
  player: Player;
  sessionToken: string;
  gameState: GameState | null;
}

export interface GameActionRequest {
  action: BettingAction;
  amount?: number;
  sessionToken: string;
}

export interface GameActionResponse {
  success: boolean;
  newPhase?: GamePhase;
  winners?: WinnerInfo[];
  error?: string;
}

export interface WinnerInfo {
  playerId: number;
  playerName: string;
  hand: EvaluatedHand;
  amountWon: number;
}

export interface StartGameRequest {
  sessionToken: string;
}

// ── Zustand Store ─────────────────────────────────────────────

export interface GameStore {
  // State
  room: Room | null;
  players: Player[];
  gameState: GameState | null;
  myPlayer: Player | null;
  myHand: Card[];
  playerHands: Record<number, PlayerHand>;
  chatMessages: ChatMessage[];
  settlements: Settlement[];
  onlinePlayers: Set<string>;
  chatOpen: boolean;
  unreadCount: number;
  lastWinners: WinnerInfo[];

  // Room / player actions
  setRoom: (room: Room) => void;
  setPlayers: (players: Player[]) => void;
  updatePlayer: (player: Partial<Player> & { id: number }) => void;
  setMyPlayer: (player: Player) => void;
  setMyHand: (cards: Card[]) => void;

  // Game state actions
  setGameState: (gs: GameState) => void;
  updateGameState: (partial: Partial<GameState>) => void;
  updatePlayerHand: (hand: Partial<PlayerHand> & { playerId: number }) => void;
  setLastWinners: (winners: WinnerInfo[]) => void;

  // Chat
  addChatMessage: (msg: ChatMessage) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  toggleChat: () => void;
  markChatRead: () => void;

  // Settlement
  setSettlements: (settlements: Settlement[]) => void;

  // Presence
  setPlayerOnline: (sessionToken: string) => void;
  setPlayerOffline: (sessionToken: string) => void;
}

// ── Supabase DB Row types (snake_case from DB) ───────────────

export interface DbRoom {
  id: number;
  code: string;
  name: string;
  status: RoomStatus;
  host_id: number | null;
  settings: RoomSettings;
  created_at: string;
}

export interface DbPlayer {
  id: number;
  room_id: number;
  name: string;
  phone_number: string;
  seat_position: number | null;
  chip_count: number;
  status: PlayerStatus;
  is_host: boolean;
  session_token: string;
  joined_at: string;
  left_at: string | null;
}

export interface DbGameState {
  id: number;
  room_id: number;
  phase: GamePhase;
  community_cards: Card[] | null;
  pot: { main: number; side_pots: Array<{ amount: number; eligible_player_ids?: number[] }> };
  current_turn_player_id: number | null;
  small_blind: number;
  big_blind: number;
  dealer_position: number;
  round_number: number;
  last_aggressor_id: number | null;
  updated_at: string;
}

export interface DbPlayerHand {
  id: number;
  game_state_id: number;
  player_id: number;
  cards: Card[];
  is_folded: boolean;
  is_all_in: boolean;
  current_bet: number;
  total_invested: number;
  action_taken: BettingAction | null;
}

export interface DbChatMessage {
  id: number;
  room_id: number;
  player_id: number | null;
  message: string;
  created_at: string;
}

export interface DbSettlement {
  id: number;
  room_id: number;
  from_player_id: number;
  to_player_id: number;
  amount: number;
  is_paid: boolean;
  created_at: string;
}
