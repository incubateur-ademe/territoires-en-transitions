import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {Database} from '@tet/api';
import {SupabaseClient} from '@supabase/supabase-js';

/**
 * Pour accéder à supabase depuis les composants serveur
 */
export function createClient(cookieStore: ReturnType<typeof cookies>)
  : SupabaseClient<Database> {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );
}
