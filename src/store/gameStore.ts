"use client";

import { create } from "zustand";
import type {
  GameStore,
  Room,
  Player,
  GameState,
  PlayerHand,
  Card,
  ChatMessage,
  Settlement,
  WinnerInfo,
} from "@/types";

export const useGameStore = create<GameStore>((set, get) => ({
  // ── Initial State ─────────────────────────────────────────
  room: null,
  players: [],
  gameState: null,
  myPlayer: null,
  myHand: [],
  playerHands: {},
  chatMessages: [],
  settlements: [],
  onlinePlayers: new Set(),
  chatOpen: false,
  unreadCount: 0,
  lastWinners: [],

  // ── Room / Player ─────────────────────────────────────────
  setRoom: (room: Room) => set({ room }),

  setPlayers: (players: Player[]) => set({ players }),

  updatePlayer: (partial: Partial<Player> & { id: number }) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === partial.id ? { ...p, ...partial } : p
      ),
      myPlayer:
        state.myPlayer?.id === partial.id
          ? { ...state.myPlayer, ...partial }
          : state.myPlayer,
    })),

  setMyPlayer: (player: Player) => set({ myPlayer: player }),

  setMyHand: (cards: Card[]) => set({ myHand: cards }),

  // ── Game State ────────────────────────────────────────────
  setGameState: (gs: GameState) => set({ gameState: gs }),

  updateGameState: (partial: Partial<GameState>) =>
    set((state) => ({
      gameState: state.gameState ? { ...state.gameState, ...partial } : null,
    })),

  updatePlayerHand: (hand: Partial<PlayerHand> & { playerId: number }) =>
    set((state) => ({
      playerHands: {
        ...state.playerHands,
        [hand.playerId]: {
          ...(state.playerHands[hand.playerId] ?? {}),
          ...hand,
        },
      },
    })),

  setLastWinners: (winners: WinnerInfo[]) => set({ lastWinners: winners }),

  // ── Chat ──────────────────────────────────────────────────
  addChatMessage: (msg: ChatMessage) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, msg],
      unreadCount: state.chatOpen ? 0 : state.unreadCount + 1,
    })),

  setChatMessages: (msgs: ChatMessage[]) => set({ chatMessages: msgs }),

  toggleChat: () =>
    set((state) => ({
      chatOpen: !state.chatOpen,
      unreadCount: !state.chatOpen ? 0 : state.unreadCount,
    })),

  markChatRead: () => set({ unreadCount: 0 }),

  // ── Settlement ────────────────────────────────────────────
  setSettlements: (settlements: Settlement[]) => set({ settlements }),

  // ── Presence ──────────────────────────────────────────────
  setPlayerOnline: (sessionToken: string) =>
    set((state) => {
      const next = new Set(state.onlinePlayers);
      next.add(sessionToken);
      return { onlinePlayers: next };
    }),

  setPlayerOffline: (sessionToken: string) =>
    set((state) => {
      const next = new Set(state.onlinePlayers);
      next.delete(sessionToken);
      return { onlinePlayers: next };
    }),
}));
