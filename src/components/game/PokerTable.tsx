"use client";

import { useCallback } from "react";
import { PlayerSeat } from "./PlayerSeat";
import { CommunityCards } from "./CommunityCards";
import { PotDisplay } from "./PotDisplay";
import { BettingControls } from "./BettingControls";
import { useGameStore } from "@/store/gameStore";
import type { BettingAction } from "@/types";

// Seat positions around oval table (% of container, center-origin)
// 9 positions: bottom-center (hero), then clockwise
const SEAT_POSITIONS = [
  { bottom: "5%", left: "50%", transform: "translateX(-50%)" },   // 0 - hero/bottom
  { bottom: "18%", left: "15%", transform: "" },                    // 1 - bottom-left
  { top: "35%", left: "3%", transform: "" },                        // 2 - mid-left
  { top: "10%", left: "12%", transform: "" },                       // 3 - top-left
  { top: "3%", left: "50%", transform: "translateX(-50%)" },       // 4 - top
  { top: "10%", right: "12%", transform: "" },                      // 5 - top-right
  { top: "35%", right: "3%", transform: "" },                       // 6 - mid-right
  { bottom: "18%", right: "15%", transform: "" },                   // 7 - bottom-right
  { bottom: "5%", right: "5%", transform: "" },                     // 8 - extra
];

interface PokerTableProps {
  roomCode: string;
}

export function PokerTable({ roomCode: _roomCode }: PokerTableProps) {
  const {
    players,
    gameState,
    myPlayer,
    myHand,
    playerHands,
    room,
    unreadCount,
    toggleChat,
  } = useGameStore();

  const isMyTurn =
    gameState?.currentTurnPlayerId === myPlayer?.id;

  const activeBettingPhases = ["pre_flop", "flop", "turn", "river"];
  const isInBettingPhase = gameState
    ? activeBettingPhases.includes(gameState.phase)
    : false;

  const myHand_ = myPlayer ? playerHands[myPlayer.id] : undefined;
  const maxBet = Object.values(playerHands).reduce(
    (max, h) => Math.max(max, h.currentBet ?? 0),
    0
  );
  const callAmount = Math.max(0, maxBet - (myHand_?.currentBet ?? 0));
  const canCheck = callAmount === 0;
  const bigBlind = gameState?.bigBlind ?? 20;
  const minRaise = maxBet + bigBlind;
  const maxRaise = myPlayer?.chipCount ?? 0;

  const handleAction = useCallback(
    async (action: BettingAction, amount?: number) => {
      const sessionToken = localStorage.getItem("session_token");
      if (!sessionToken) return;

      await fetch("/api/game/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({ action, amount, sessionToken }),
      });
    },
    []
  );

  const handleAutoFold = useCallback(async () => {
    if (isMyTurn) await handleAction("fold");
  }, [isMyTurn, handleAction]);

  // Map players to seat positions
  const seatedPlayers = players
    .filter((p) => p.seatPosition !== null && p.status !== "left")
    .sort((a, b) => (a.seatPosition ?? 0) - (b.seatPosition ?? 0));

  // Find my seat index for layout
  const mySeatIdx = seatedPlayers.findIndex((p) => p.id === myPlayer?.id);

  // Re-order so "me" is always at seat 0 (bottom)
  const orderedPlayers =
    mySeatIdx >= 0
      ? [
          ...seatedPlayers.slice(mySeatIdx),
          ...seatedPlayers.slice(0, mySeatIdx),
        ]
      : seatedPlayers;

  const dealerPos = gameState?.dealerPosition ?? 0;

  const phaseLabel: Record<string, string> = {
    waiting_for_players: "Waiting",
    dealing: "Dealing",
    pre_flop: "Pre-Flop",
    flop: "Flop",
    turn: "Turn",
    river: "River",
    showdown: "Showdown",
    settlement: "Settlement",
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-bg-primary select-none">
      {/* Poker table oval */}
      <div
        className="poker-table absolute inset-8 rounded-[50%]"
        style={{ borderRadius: "50%" }}
      />

      {/* Phase indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <span className="text-xs font-medium bg-bg-tertiary/80 text-text-secondary px-3 py-1 rounded-full border border-border">
          {phaseLabel[gameState?.phase ?? "waiting_for_players"] ?? ""}
          {gameState && (
            <span className="text-text-muted ml-2">
              Round {gameState.roundNumber}
            </span>
          )}
        </span>
      </div>

      {/* Center area: community cards + pot */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 pointer-events-none">
        {gameState && (
          <>
            <CommunityCards
              cards={gameState.communityCards}
              phase={gameState.phase}
            />
            <PotDisplay pot={gameState.pot} />
          </>
        )}
      </div>

      {/* Player seats */}
      {orderedPlayers.map((player, idx) => {
        if (idx >= SEAT_POSITIONS.length) return null;
        const pos = SEAT_POSITIONS[idx];
        const hand = playerHands[player.id];
        const isCurrentTurn = gameState?.currentTurnPlayerId === player.id;
        const isMe = player.id === myPlayer?.id;

        return (
          <div
            key={player.id}
            className="absolute z-20"
            style={{
              bottom: pos.bottom,
              top: pos.top,
              left: pos.left,
              right: pos.right,
              transform: pos.transform,
            }}
          >
            <PlayerSeat
              player={player}
              hand={hand}
              holeCards={isMe ? myHand : undefined}
              isCurrentTurn={isCurrentTurn}
              isMe={isMe}
              isDealer={player.seatPosition === dealerPos}
              isSmallBlind={
                player.seatPosition === (dealerPos + 1) % seatedPlayers.length
              }
              isBigBlind={
                player.seatPosition === (dealerPos + 2) % seatedPlayers.length
              }
              gameUpdatedAt={gameState?.updatedAt}
              turnTimeoutSeconds={room?.settings.turnTimeoutSeconds ?? 30}
              onTimeout={isMe ? handleAutoFold : undefined}
            />
          </div>
        );
      })}

      {/* Chat button */}
      <button
        onClick={toggleChat}
        className="absolute top-4 right-4 z-30 w-10 h-10 bg-bg-secondary border border-border rounded-full flex items-center justify-center text-text-secondary hover:bg-bg-tertiary transition-colors"
        aria-label="Open chat"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Betting controls (only shown on my turn during betting phases) */}
      {isMyTurn && isInBettingPhase && (
        <BettingControls
          canCheck={canCheck}
          callAmount={callAmount}
          minRaise={Math.min(minRaise, maxRaise)}
          maxRaise={maxRaise}
          myChips={myPlayer?.chipCount ?? 0}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
