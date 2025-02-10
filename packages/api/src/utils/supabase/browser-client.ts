import { Database } from '@/api';
import { createBrowserClient } from '@supabase/ssr';
import { ENV } from '../../environmentVariables';
import { getCookieOptions } from './cookie-options';

export const supabaseClient = createBrowserClient<Database>(
  ENV.supabase_url as string,
  ENV.supabase_anon_key as string,
  {
    cookieOptions: getCookieOptions(),
  }
);
