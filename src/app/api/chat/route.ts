import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.headers.get("x-session-token");
    const { message } = await req.json();

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!message?.trim() || message.length > 500) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
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

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        room_id: player.room_id,
        player_id: player.id,
        message: message.trim(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
