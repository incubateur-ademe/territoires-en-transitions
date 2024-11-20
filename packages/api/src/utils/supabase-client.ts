import { createClient } from '@supabase/supabase-js';
import { Database } from '@tet/api';
import { ENV } from '../environmentVariables';

export const supabaseClient = createClient<Database>(
  ENV.supabase_url as string,
  ENV.supabase_anon_key as string,
  {
    db: {
      schema: 'public',
    },
  }
);
