import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getNextPhase, resolveShowdown } from "@/lib/poker/stateMachine";
import { getNextActivePlayer, validateBetAction } from "@/lib/poker/betting";
import type { BettingAction, GameActionRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: GameActionRequest = await req.json();
    const sessionToken = req.headers.get("x-session-token") ?? body.sessionToken;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data: player } = await supabase
      .from("players")
      .select("*, rooms!inner(settings)")
      .eq("session_token", sessionToken)
      .neq("status", "left")
      .single();

    if (!player) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current game state with deck data
    const { data: gameState } = await supabase
      .from("game_state")
      .select("*")
      .eq("room_id", player.room_id)
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (!gameState) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const activeBettingPhases = ["pre_flop", "flop", "turn", "river"];
    if (!activeBettingPhases.includes(gameState.phase)) {
      return NextResponse.json(
        { error: "Not in a betting phase" },
        { status: 409 }
      );
    }

    if (gameState.current_turn_player_id !== player.id) {
      return NextResponse.json({ error: "Not your turn" }, { status: 403 });
    }

    // Get all player hands
    const { data: allHands } = await supabase
      .from("player_hands")
      .select("*")
      .eq("game_state_id", gameState.id);

    if (!allHands) {
      return NextResponse.json({ error: "Game state error" }, { status: 500 });
    }

    const myHand = allHands.find((h) => h.player_id === player.id);
    if (!myHand) {
      return NextResponse.json({ error: "Player hand not found" }, { status: 404 });
    }

    const action = body.action as BettingAction;
    const maxBet = Math.max(...allHands.map((h) => h.current_bet));
    const bigBlind = gameState.big_blind;
    const settings = (player as any).rooms.settings ?? {};

    // Validate the action
    const validation = validateBetAction(
      action,
      body.amount,
      myHand.current_bet,
      maxBet,
      player.chip_count,
      bigBlind
    );

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Apply the action
    let newChipCount = player.chip_count;
    let newCurrentBet = myHand.current_bet;
    let newTotalInvested = myHand.total_invested;
    let newStatus = player.status;
    let newIsAllIn = false;
    let newLastAggressorId = gameState.last_aggressor_id;

    switch (action) {
      case "fold":
        break;

      case "check":
        break;

      case "call": {
        const callAmount = Math.min(maxBet - myHand.current_bet, player.chip_count);
        if (callAmount >= player.chip_count) {
          // All-in call
          newIsAllIn = true;
          newStatus = "all_in";
        }
        newChipCount -= callAmount;
        newCurrentBet += callAmount;
        newTotalInvested += callAmount;
        break;
      }

      case "raise": {
        const raiseTotal = body.amount!;
        const addedAmount = raiseTotal - myHand.current_bet;
        if (addedAmount >= player.chip_count) {
          newIsAllIn = true;
          newStatus = "all_in";
          newChipCount = 0;
          newCurrentBet = myHand.current_bet + player.chip_count;
          newTotalInvested += player.chip_count;
        } else {
          newChipCount -= addedAmount;
          newCurrentBet = raiseTotal;
          newTotalInvested += addedAmount;
        }
        newLastAggressorId = player.id;
        break;
      }

      case "all_in": {
        const allInAmount = player.chip_count;
        newChipCount = 0;
        newCurrentBet = myHand.current_bet + allInAmount;
        newTotalInvested += allInAmount;
        newIsAllIn = true;
        newStatus = "all_in";
        if (newCurrentBet > maxBet) {
          newLastAggressorId = player.id;
        }
        break;
      }
    }

    // Update player hand
    await supabase
      .from("player_hands")
      .update({
        is_folded: action === "fold",
        is_all_in: newIsAllIn,
        current_bet: newCurrentBet,
        total_invested: newTotalInvested,
        action_taken: action,
      })
      .eq("id", myHand.id);

    // Update player chip count and status
    await supabase
      .from("players")
      .update({
        chip_count: newChipCount,
        status: action === "fold" ? "folded" : newStatus,
      })
      .eq("id", player.id);

    // Update pot
    const potAddition =
      newCurrentBet - myHand.current_bet - (myHand.action_taken ? 0 : 0);
    const actualAdded = newTotalInvested - myHand.total_invested;

    const { main: currentMain } = gameState.pot as { main: number; side_pots: any[] };
    await supabase
      .from("game_state")
      .update({
        pot: { main: currentMain + actualAdded, side_pots: [] },
        last_aggressor_id: newLastAggressorId,
      })
      .eq("id", gameState.id);

    // Get fresh hands to check round completion
    const { data: freshHands } = await supabase
      .from("player_hands")
      .select("*")
      .eq("game_state_id", gameState.id);

    if (!freshHands) {
      return NextResponse.json({ error: "State error" }, { status: 500 });
    }

    // Get all room players for turn order
    const { data: roomPlayers } = await supabase
      .from("players")
      .select("id, seat_position, status")
      .eq("room_id", player.room_id)
      .neq("status", "left");

    const handsForMachine = freshHands.map((h) => ({
      playerId: h.player_id,
      isFolded: h.is_folded,
      isAllIn: h.is_all_in,
      currentBet: h.current_bet,
      actionTaken: h.action_taken,
    }));

    const transition = getNextPhase(
      gameState.phase,
      handsForMachine,
      newLastAggressorId,
      gameState.deck_remaining ?? [],
      gameState.community_cards ?? []
    );

    if (transition) {
      // Advance phase
      if (transition.nextPhase === "showdown") {
        await handleShowdown(supabase, gameState, freshHands, roomPlayers ?? []);
      } else if ("communityCards" in transition) {
        // Reset bets for new street, set first-to-act
        const activePlayers = (roomPlayers ?? [])
          .filter((p) => {
            const hand = freshHands.find((h) => h.player_id === p.id);
            return hand && !hand.is_folded && !hand.is_all_in;
          })
          .sort((a, b) => (a.seat_position ?? 0) - (b.seat_position ?? 0));

        const firstToAct = activePlayers[0]?.id ?? null;

        await supabase
          .from("player_hands")
          .update({ current_bet: 0, action_taken: null })
          .eq("game_state_id", gameState.id);

        await supabase.from("game_state").update({
          phase: transition.nextPhase,
          community_cards: transition.communityCards,
          deck_remaining: transition.deckRemaining,
          current_turn_player_id: firstToAct,
          last_aggressor_id: null,
        }).eq("id", gameState.id);
      } else {
        await supabase
          .from("game_state")
          .update({ phase: transition.nextPhase })
          .eq("id", gameState.id);
      }

      return NextResponse.json({
        success: true,
        newPhase: transition.nextPhase,
      });
    } else {
      // Advance to next player's turn
      const activeInRound = (roomPlayers ?? []).filter((p) => {
        const hand = freshHands.find((h) => h.player_id === p.id);
        return p.status === "active" && hand && !hand.is_folded;
      });

      const nextPlayerId = getNextActivePlayer(
        activeInRound.map((p) => ({
          id: p.id,
          seatPosition: p.seat_position ?? 0,
          status: p.status,
        })),
        player.id
      );

      await supabase
        .from("game_state")
        .update({ current_turn_player_id: nextPlayerId })
        .eq("id", gameState.id);

      return NextResponse.json({ success: true });
    }
  } catch (err) {
    console.error("Action error:", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}

async function handleShowdown(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  gameState: any,
  playerHands: any[],
  roomPlayers: any[]
) {
  const activePlayers = roomPlayers.map((p) => ({
    id: p.id,
    chipCount: p.chip_count,
  }));

  const handsForShowdown = playerHands
    .filter((h) => !h.is_folded)
    .map((h) => ({
      playerId: h.player_id,
      holeCards: h.cards,
      isFolded: h.is_folded,
      isAllIn: h.is_all_in,
      totalInvested: h.total_invested,
    }));

  const { main: potTotal } = gameState.pot as { main: number };

  const { bestHandFrom7 } = await import("@/lib/poker/evaluator");

  const result = resolveShowdown(
    activePlayers,
    handsForShowdown,
    gameState.community_cards ?? [],
    potTotal
  );

  // Award chips
  for (const [playerId, chipCount] of result.updatedChips) {
    await supabase
      .from("players")
      .update({ chip_count: chipCount, status: "waiting" })
      .eq("id", playerId);
  }

  // Reset all hand statuses to folded players
  await supabase
    .from("players")
    .update({ status: "waiting" })
    .eq("room_id", gameState.room_id)
    .eq("status", "folded");

  // Advance game state to showdown, then waiting
  await supabase.from("game_state").update({
    phase: "showdown",
    current_turn_player_id: null,
    dealer_position: (gameState.dealer_position + 1) % 9,
    round_number: gameState.round_number + 1,
    pot: { main: 0, side_pots: [] },
    community_cards: [],
  }).eq("id", gameState.id);

  // After brief delay, reset to waiting_for_players
  // (Client handles the showdown display timer; next deal resets phase)
}
