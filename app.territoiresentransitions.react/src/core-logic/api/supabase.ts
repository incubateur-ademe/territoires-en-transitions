import {createClient} from '@supabase/supabase-js';
import {ENV} from 'environmentVariables';

/**
 * Supabase client
 */
export const supabaseClient = createClient(
  ENV.supabase_url!,
  ENV.supabase_anon_key!,
  {
    schema: 'public',
  }
);
