import {Database} from '@tet/api';
import {
  createServerComponentClient,
  Session,
  SupabaseClient,
} from '@supabase/auth-helpers-nextjs';
import {
  ReadonlyRequestCookies,
} from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export async function createServerClient(cookies: () => ReadonlyRequestCookies)
  : Promise<{ supabase: SupabaseClient<Database>, session: Session | null }> {

  const supabase = createServerComponentClient<Database>(
    {cookies}, {
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      options: {
        db: {
          schema: 'public',
        },
      },
    },
  );
  const {error, data} = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return {supabase, session: data.session};
}
