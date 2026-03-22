import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { dealHand } from "@/lib/poker/stateMachine";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.headers.get("x-session-token");
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Validate session and get player
    const { data: player } = await supabase
      .from("players")
      .select("*, rooms!inner(code, settings, status)")
      .eq("session_token", sessionToken)
      .neq("status", "left")
      .single();

    if (!player) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!player.is_host) {
      return NextResponse.json({ error: "Only host can start the game" }, { status: 403 });
    }

    const room = (player as unknown as { rooms: { code: string; settings?: Record<string, number>; status: string } }).rooms;
    if (room.status === "finished") {
      return NextResponse.json({ error: "Game has ended" }, { status: 410 });
    }

    // Get current game state
    const { data: gameState } = await supabase
      .from("game_state")
      .select("*")
      .eq("room_id", player.room_id)
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (!gameState || gameState.phase !== "waiting_for_players") {
      return NextResponse.json(
        { error: "Game is already in progress" },
        { status: 409 }
      );
    }

    // Get active players
    const { data: players } = await supabase
      .from("players")
      .select("id, seat_position, chip_count, name")
      .eq("room_id", player.room_id)
      .eq("status", "waiting");

    if (!players || players.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 players to start" },
        { status: 400 }
      );
    }

    // Assign seat positions if not already set
    const unseated = players.filter((p) => p.seat_position === null);
    if (unseated.length > 0) {
      const usedSeats = new Set(
        players.filter((p) => p.seat_position !== null).map((p) => p.seat_position)
      );
      let seat = 0;
      for (const p of unseated) {
        while (usedSeats.has(seat)) seat++;
        await supabase
          .from("players")
          .update({ seat_position: seat, status: "active" })
          .eq("id", p.id);
        usedSeats.add(seat);
        p.seat_position = seat;
        seat++;
      }
    } else {
      // Set all waiting players to active
      await supabase
        .from("players")
        .update({ status: "active" })
        .eq("room_id", player.room_id)
        .eq("status", "waiting");
    }

    const seatedPlayers = players.map((p, i) => ({
      id: p.id,
      seatPosition: p.seat_position ?? i,
      chipCount: p.chip_count,
    }));

    const settings = room.settings ?? {};
    const smallBlind = gameState.small_blind ?? settings.small_blind ?? 10;
    const bigBlind = gameState.big_blind ?? settings.big_blind ?? 20;
    const dealerPos = gameState.dealer_position ?? 0;

    // Deal cards
    const result = dealHand(seatedPlayers, dealerPos, smallBlind, bigBlind);

    // Update room status to playing
    await supabase
      .from("rooms")
      .update({ status: "playing" })
      .eq("id", player.room_id);

    // Calculate initial pot after blinds
    const potAmount = smallBlind + bigBlind;

    // Update game state
    await supabase
      .from("game_state")
      .update({
        phase: "pre_flop",
        deck_seed: result.deckSeed,
        deck_remaining: result.deckRemaining,
        pot: { main: potAmount, side_pots: [] },
        current_turn_player_id: result.firstToActId,
        dealer_position: dealerPos,
        community_cards: [],
      })
      .eq("id", gameState.id);

    // Insert player hands
    await supabase.from("player_hands").insert(
      result.playerHands.map((ph) => ({
        game_state_id: gameState.id,
        player_id: ph.playerId,
        cards: ph.cards,
        is_folded: false,
        current_bet: 0,
        total_invested: 0,
      }))
    );

    // Post blinds — deduct from SB and BB players
    await Promise.all([
      supabase
        .from("players")
        .update({
          chip_count: supabase.rpc("decrement_chips", {
            player_id: result.smallBlindPlayerId,
            amount: result.smallBlindAmount,
          }),
        })
        .eq("id", result.smallBlindPlayerId),
      supabase
        .from("players")
        .update({
          chip_count: supabase.rpc("decrement_chips", {
            player_id: result.bigBlindPlayerId,
            amount: result.bigBlindAmount,
          }),
        })
        .eq("id", result.bigBlindPlayerId),
    ]);

    // Update hand invested for blinds
    await supabase
      .from("player_hands")
      .update({ current_bet: smallBlind, total_invested: smallBlind })
      .eq("game_state_id", gameState.id)
      .eq("player_id", result.smallBlindPlayerId);

    await supabase
      .from("player_hands")
      .update({ current_bet: bigBlind, total_invested: bigBlind })
      .eq("game_state_id", gameState.id)
      .eq("player_id", result.bigBlindPlayerId);

    // Update chip counts directly
    for (const p of seatedPlayers) {
      let deduction = 0;
      if (p.id === result.smallBlindPlayerId) deduction = smallBlind;
      if (p.id === result.bigBlindPlayerId) deduction = bigBlind;
      if (deduction > 0) {
        await supabase
          .from("players")
          .update({ chip_count: p.chipCount - deduction })
          .eq("id", p.id);
      }
    }

    return NextResponse.json({ success: true, phase: "pre_flop" });
  } catch (err) {
    console.error("Deal error:", err);
    return NextResponse.json({ error: "Failed to deal" }, { status: 500 });
  }
}
