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

  let query = supabase
    .from("players")
    .select("*, rooms!inner(code)")
    .eq("session_token", sessionToken)
    .neq("status", "left")
    .single();

  const { data, error } = await query;

  if (error || !data) return null;
  if (roomCode && (data as any).rooms.code !== roomCode) return null;

  return data;
}
