import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser-side Supabase client (anon key).
 * Uses anon key — for reads and Realtime subscriptions only.
 * All writes go through Route Handlers that use the service-role key.
 */
export function getSupabaseClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
