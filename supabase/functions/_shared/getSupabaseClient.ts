import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Database } from './database.types.ts';

/** Crée le client avec le contexte d'authentification de l'utilisateur connecté */
export const getSupabaseClient = (req: Request) =>
  createClient<Database>(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      db: { schema: 'public' },
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
      auth: {
        // évite un avertissement avec deno hors du navigateur.
        persistSession: false,
      },
    }
  );

/** Crée le client avec le contexte d'authentification "Service" */
export const getSupabaseClientWithServiceRole = () =>
  createClient<Database>(
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

export type TSupabaseClient = ReturnType<typeof getSupabaseClient>;
