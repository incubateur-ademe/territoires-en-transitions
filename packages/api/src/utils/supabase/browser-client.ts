'use client';

import { CookieOptionsWithName, createBrowserClient } from '@supabase/ssr';
import { Database } from '../../database.types';
import { ENV } from '../../environmentVariables';

export function createClient(cookieOptions: CookieOptionsWithName) {
  return createBrowserClient<Database>(
    ENV.supabase_url as string,
    ENV.supabase_anon_key as string,
    {
      cookieOptions,
    }
  );
}

/**
 * @deprecated Utiliser `createClient` avec les options de cookie à la place
 */
export function createClientWithoutCookieOptions() {
  return createBrowserClient<Database>(
    ENV.supabase_url as string,
    ENV.supabase_anon_key as string
  );
}
