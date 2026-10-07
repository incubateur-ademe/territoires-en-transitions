'use client';

import { CookieOptionsWithName, createBrowserClient } from '@supabase/ssr';
import { ENV } from '../../environmentVariables';

export function createClient(cookieOptions: CookieOptionsWithName) {
  return createBrowserClient(
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
  return createBrowserClient(
    ENV.supabase_url as string,
    ENV.supabase_anon_key as string
  );
}
