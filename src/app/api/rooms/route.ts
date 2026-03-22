import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/roomCode";
import { mapDbRoom } from "@/lib/utils";
import type { CreateRoomRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: CreateRoomRequest = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Room name required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Generate unique code (retry on collision)
    let code = generateRoomCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data } = await supabase
        .from("rooms")
        .select("id")
        .eq("code", code)
        .single();
      if (!data) break;
      code = generateRoomCode();
      attempts++;
    }

    const settings = {
      small_blind: body.settings?.smallBlind ?? 10,
      big_blind: body.settings?.bigBlind ?? 20,
      starting_chips: body.settings?.startingChips ?? 1000,
      max_players: body.settings?.maxPlayers ?? 9,
      turn_timeout_seconds: body.settings?.turnTimeoutSeconds ?? 30,
    };

    const { data: room, error } = await supabase
      .from("rooms")
      .insert({ code, name: body.name.trim(), settings })
      .select()
      .single();

    if (error || !room) {
      return NextResponse.json(
        { error: "Failed to create room" },
        { status: 500 }
      );
    }

    // Create initial game_state row
    await supabase.from("game_state").insert({
      room_id: room.id,
      phase: "waiting_for_players",
      small_blind: settings.small_blind,
      big_blind: settings.big_blind,
    });

    return NextResponse.json({ room: mapDbRoom(room) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
