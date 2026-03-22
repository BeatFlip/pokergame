"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import type { Card } from "@/types";

/**
 * Fetch the current player's hole cards once from the server.
 * Cards are never broadcast via Realtime — always fetched via API.
 */
export function usePlayerState(roomCode: string) {
  const { myPlayer, gameState, setMyHand } = useGameStore();

  useEffect(() => {
    if (!myPlayer || !gameState || gameState.phase === "waiting_for_players") {
      return;
    }

    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    fetch(`/api/game/my-hand?room=${roomCode}`, {
      headers: { "x-session-token": sessionToken },
    })
      .then((res) => res.json())
      .then((data: { cards?: Card[] }) => {
        if (data.cards) setMyHand(data.cards);
      })
      .catch(console.error);
  }, [roomCode, gameState?.id, myPlayer?.id]);
}
