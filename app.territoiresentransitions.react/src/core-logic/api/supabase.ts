import {createClient} from '@supabase/supabase-js';
import {ENV} from 'environmentVariables';
import {Database} from 'types/database.types';

/**
 * Supabase client
 */
export const supabaseClient = createClient<Database>(
  ENV.supabase_url!,
  ENV.supabase_anon_key!,
  {
    db: {
      schema: 'public',
    },
  }
);
