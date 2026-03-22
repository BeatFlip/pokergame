import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/game/my-hand?room=[code]
 * Returns the current player's hole cards.
 * Authenticated via x-session-token header.
 * Cards are NEVER broadcast via Realtime — only fetched here.
 */
export async function GET(req: NextRequest) {
  const sessionToken = req.headers.get("x-session-token");
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: player } = await supabase
    .from("players")
    .select("id, room_id")
    .eq("session_token", sessionToken)
    .neq("status", "left")
    .single();

  if (!player) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the latest game state for this room
  const { data: gameState } = await supabase
    .from("game_state")
    .select("id")
    .eq("room_id", player.room_id)
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (!gameState) {
    return NextResponse.json({ cards: [] });
  }

  const { data: hand } = await supabase
    .from("player_hands")
    .select("cards")
    .eq("game_state_id", gameState.id)
    .eq("player_id", player.id)
    .single();

  return NextResponse.json({ cards: hand?.cards ?? [] });
}
