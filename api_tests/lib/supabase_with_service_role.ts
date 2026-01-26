import 'https://deno.land/x/dotenv/load.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Database } from './database.types.ts';

/**
 * Client Supabase avec un accès privilégié, utilisé pour de l'admin
 */
export const supabaseWithServiceRole = createClient<Database>(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      // Pour fonctionner avec deno hors du navigateur.
      persistSession: false,
    },
  }
);
