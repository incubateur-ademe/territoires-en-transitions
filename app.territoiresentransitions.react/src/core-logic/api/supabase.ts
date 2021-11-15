import {createClient} from '@supabase/supabase-js';
import {ENV} from 'environmentVariables';

/**
 * Supabase client
 */
export const supabase = createClient(
  ENV.supabase_url!,
  ENV.supabase_anon_key!,
  {
    schema: 'public',
  }
);
