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

// options pour `useQuery` lorsqu'il s'agit de données qui ne changent pas trop
// souvent (définitions du référentiel etc.)
export const DISABLE_AUTO_REFETCH = {
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
};
