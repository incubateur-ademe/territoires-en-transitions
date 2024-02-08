import {createBrowserClient} from '@supabase/ssr';
import {Database} from '@tet/api';

/**
 * Pour accéder à supabase depuis les composants client
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
