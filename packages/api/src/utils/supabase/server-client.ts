import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ENV } from '../../environmentVariables';
import { Database } from '../../typeUtils';
import { getCookieOptions } from './cookie-options';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const cookieOptions = getCookieOptions();

  return createServerClient<Database>(
    ENV.supabase_url as string,
    ENV.supabase_anon_key as string,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
