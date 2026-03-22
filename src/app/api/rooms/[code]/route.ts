import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generateUUID, mapDbPlayer, mapDbRoom } from "@/lib/utils";
import { isValidNorwegianPhone } from "@/lib/vipps";
import type { JoinRoomRequest } from "@/types";

// GET /api/rooms/[code] — fetch room + players
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const supabase = getSupabaseAdmin();
  const code = params.code.toUpperCase();

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", room.id)
    .neq("status", "left")
    .order("joined_at");

  const { data: gameState } = await supabase
    .from("game_state")
    .select(
      "id, room_id, phase, community_cards, pot, current_turn_player_id, small_blind, big_blind, dealer_position, round_number, last_aggressor_id, updated_at"
    )
    .eq("room_id", room.id)
    .order("id", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({
    room: mapDbRoom(room),
    players: (players ?? []).map(mapDbPlayer),
    gameState,
  });
}

// POST /api/rooms/[code] — join room (register player)
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body: JoinRoomRequest = await req.json();
    const code = params.code.toUpperCase();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    if (!isValidNorwegianPhone(body.phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid Norwegian phone number (use +47XXXXXXXX format)" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: room } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", code)
      .single();

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    if (room.status === "finished") {
      return NextResponse.json({ error: "Game has ended" }, { status: 410 });
    }

    // Check max players
    const { count } = await supabase
      .from("players")
      .select("id", { count: "exact" })
      .eq("room_id", room.id)
      .neq("status", "left");

    const maxPlayers = room.settings?.max_players ?? 9;
    if ((count ?? 0) >= maxPlayers) {
      return NextResponse.json({ error: "Room is full" }, { status: 409 });
    }

    const sessionToken = generateUUID();
    const isFirstPlayer = (count ?? 0) === 0;
    const startingChips = room.settings?.starting_chips ?? 1000;

    const { data: player, error } = await supabase
      .from("players")
      .insert({
        room_id: room.id,
        name: body.name.trim(),
        phone_number: body.phoneNumber,
        chip_count: startingChips,
        is_host: isFirstPlayer,
        session_token: sessionToken,
        status: "waiting",
      })
      .select()
      .single();

    if (error || !player) {
      return NextResponse.json(
        { error: "Failed to join room" },
        { status: 500 }
      );
    }

    // Set as host if first player
    if (isFirstPlayer) {
      await supabase
        .from("rooms")
        .update({ host_id: player.id })
        .eq("id", room.id);
    }

    const { data: gameState } = await supabase
      .from("game_state")
      .select(
        "id, room_id, phase, community_cards, pot, current_turn_player_id, small_blind, big_blind, dealer_position, round_number, last_aggressor_id, updated_at"
      )
      .eq("room_id", room.id)
      .order("id", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json(
      {
        player: mapDbPlayer(player),
        sessionToken,
        gameState,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
