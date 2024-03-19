import {createBrowserClient} from '@supabase/ssr';
import {SupabaseClient} from '@supabase/supabase-js';
import {Database} from '@tet/api';

/**
 * Pour accéder à supabase depuis les composants client
 */
let client: SupabaseClient<Database> | null = null;

export function createClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
