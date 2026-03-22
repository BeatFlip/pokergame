import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

/**
 * Browser-side Supabase client (anon key).
 * Uses anon key — for reads and Realtime subscriptions only.
 * All writes go through Route Handlers that use the service-role key.
 */
export function getSupabaseClient() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        realtime: { params: { eventsPerSecond: 10 } },
      }
    );
  }
  return client;
}
