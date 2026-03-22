import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service-role key.
 * Use ONLY in Route Handlers (app/api/**). Never expose to the client.
 *
 * Bypasses RLS — always validate the request's session_token before
 * performing any write operation.
 */
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Validate a player's session token and return their player record.
 * Returns null if the token is invalid or the player doesn't exist.
 */
export async function validateSessionToken(
  sessionToken: string,
  roomCode?: string
) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("session_token", sessionToken)
    .neq("status", "left")
    .single();

  if (error || !data) return null;

  if (roomCode) {
    const { data: room } = await supabase
      .from("rooms")
      .select("code")
      .eq("id", data.room_id)
      .single();
    if (!room || room.code !== roomCode) return null;
  }

  return data;
}
