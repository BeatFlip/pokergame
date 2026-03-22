import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { buildPlayerBalances, calculateSettlement } from "@/lib/poker/settlement";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.headers.get("x-session-token");
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data: player } = await supabase
      .from("players")
      .select("*")
      .eq("session_token", sessionToken)
      .single();

    if (!player) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!player.is_host) {
      return NextResponse.json(
        { error: "Only host can end the game" },
        { status: 403 }
      );
    }

    const { data: room } = await supabase
      .from("rooms")
      .select("settings, status")
      .eq("id", player.room_id)
      .single();

    const startingChips = (room?.settings as Record<string, number> | null)?.starting_chips ?? 1000;

    // Get all players (including those who left)
    const { data: players } = await supabase
      .from("players")
      .select("id, name, phone_number, chip_count")
      .eq("room_id", player.room_id);

    if (!players?.length) {
      return NextResponse.json({ error: "No players found" }, { status: 404 });
    }

    const balances = buildPlayerBalances(
      players.map((p) => ({
        id: p.id,
        name: p.name,
        phoneNumber: p.phone_number,
        chipCount: p.chip_count,
      })),
      startingChips
    );

    const transactions = calculateSettlement(balances);

    // Store settlements
    if (transactions.length > 0) {
      await supabase.from("settlements").insert(
        transactions.map((t) => ({
          room_id: player.room_id,
          from_player_id: t.fromPlayerId,
          to_player_id: t.toPlayerId,
          amount: t.amount,
        }))
      );
    }

    // Mark room as finished
    await supabase
      .from("rooms")
      .update({ status: "finished" })
      .eq("id", player.room_id);

    // Update game state to settlement phase
    await supabase
      .from("game_state")
      .update({ phase: "settlement" })
      .eq("room_id", player.room_id)
      .order("id", { ascending: false })
      .limit(1);

    return NextResponse.json({ transactions, balances });
  } catch (err) {
    console.error("Settlement error:", err);
    return NextResponse.json({ error: "Settlement failed" }, { status: 500 });
  }
}
