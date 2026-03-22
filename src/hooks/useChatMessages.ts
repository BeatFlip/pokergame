"use client";

import { useEffect } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useGameStore } from "@/store/gameStore";
import type { DbChatMessage, ChatMessage } from "@/types";

function mapDbChatMessage(
  db: DbChatMessage & { players?: { name: string } | null }
): ChatMessage {
  return {
    id: db.id,
    roomId: db.room_id,
    playerId: db.player_id,
    playerName: db.players?.name ?? "System",
    message: db.message,
    createdAt: db.created_at,
  };
}

export function useChatMessages(roomId: number, roomCode: string) {
  const { setChatMessages, addChatMessage } = useGameStore();

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Fetch last 50 messages
    supabase
      .from("chat_messages")
      .select("*, players(name)")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }: { data: Array<DbChatMessage & { players?: { name: string } | null }> | null; error: unknown }) => {
        if (data) setChatMessages(data.map(mapDbChatMessage));
      });

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const db = payload.new as DbChatMessage;
          // Fetch player name for the new message
          const { data: player } = db.player_id
            ? await supabase
                .from("players")
                .select("name")
                .eq("id", db.player_id)
                .single()
            : { data: null };

          addChatMessage(
            mapDbChatMessage({ ...db, players: player })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, roomCode]);
}
