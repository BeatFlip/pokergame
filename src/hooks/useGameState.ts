"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useGameStore } from "@/store/gameStore";
import { mapDbGameState, mapDbPlayer } from "@/lib/utils";
import type { DbGameState, DbPlayer, DbPlayerHand } from "@/types";

/**
 * Subscribe to all Realtime changes for a room.
 * Updates the Zustand store on every change event.
 * Cleans up subscription on unmount.
 */
export function useGameState(roomId: number, roomCode: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const {
    setGameState,
    setPlayers,
    updatePlayer,
    updatePlayerHand,
  } = useGameStore();

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Initial fetch + polling fallback
    const fetchSnapshot = async () => {
      const { data: gsData } = await supabase
        .from("game_state")
        .select(
          "id, room_id, phase, community_cards, pot, current_turn_player_id, small_blind, big_blind, dealer_position, round_number, last_aggressor_id, updated_at"
        )
        .eq("room_id", roomId)
        .order("id", { ascending: false })
        .limit(1)
        .single();

      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomId);

      if (gsData) setGameState(mapDbGameState(gsData as unknown as DbGameState));
      if (playersData) setPlayers((playersData as unknown as DbPlayer[]).map(mapDbPlayer));
    };

    fetchSnapshot();

    // Polling fallback — keeps lobby and game in sync if Realtime lags
    const pollInterval = setInterval(fetchSnapshot, 3000);

    // Realtime channel
    const channel = supabase
      .channel(`room:${roomCode}`)
      // Game state changes
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_state",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const db = payload.new as unknown as DbGameState;
            setGameState(mapDbGameState(db));
          }
        }
      )
      // Player changes (chip counts, status)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === "UPDATE") {
            const db = payload.new as unknown as DbPlayer;
            updatePlayer(mapDbPlayer(db));
          } else if (payload.eventType === "INSERT") {
            // Re-fetch full players list for new joins
            supabase
              .from("players")
              .select("*")
              .eq("room_id", roomId)
              .then(({ data }: { data: DbPlayer[] | null; error: unknown }) => {
                if (data) setPlayers(data.map(mapDbPlayer));
              });
          }
        }
      )
      // Player hand metadata (folds, bets) — NOT cards
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_hands",
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const db = payload.new as unknown as DbPlayerHand;
            updatePlayerHand({
              playerId: db.player_id,
              id: db.id,
              gameStateId: db.game_state_id,
              cards: [], // Never populated from Realtime
              isFolded: db.is_folded,
              isAllIn: db.is_all_in,
              currentBet: db.current_bet,
              totalInvested: db.total_invested,
              actionTaken: db.action_taken,
            });
          }
        }
      )
      // Presence: track online players
      .on("presence", { event: "join" }, ({ key }: { key: string }) => {
        useGameStore.getState().setPlayerOnline(key);
      })
      .on("presence", { event: "leave" }, ({ key }: { key: string }) => {
        useGameStore.getState().setPlayerOffline(key);
      });

    channel.subscribe((status: string) => {
      if (status === "SUBSCRIBED") {
        // Track presence with session token
        const sessionToken = localStorage.getItem("session_token");
        if (sessionToken) {
          channel.track({ sessionToken, online_at: new Date().toISOString() });
        }
      }
    });

    channelRef.current = channel;

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [roomId, roomCode]);
}
