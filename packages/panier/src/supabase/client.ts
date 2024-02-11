import {createBrowserClient} from '@supabase/ssr';
import {Database} from '@tet/api';
import {SupabaseClient} from '@supabase/supabase-js';

/**
 * Pour accéder à supabase depuis les composants client
 */
export function createClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
