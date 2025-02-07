'use client';

import { Database } from '@/api';
import { CookieOptionsWithName, createBrowserClient } from '@supabase/ssr';
import { ENV } from '../../environmentVariables';

// export const supabaseClient = createBrowserClient<Database>(
//   ENV.supabase_url as string,
//   ENV.supabase_anon_key as string
// );

export function createClient(cookieOptions: CookieOptionsWithName) {
  return createBrowserClient<Database>(
    ENV.supabase_url as string,
    ENV.supabase_anon_key as string,
    {
      cookieOptions,
    }
  );
}
