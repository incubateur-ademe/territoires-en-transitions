import "https://deno.land/x/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Database } from "./database.types.ts";

/**
 * Supabase client
 */
export const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_KEY")!,
  {
    db: {
      schema: "public",
    },
    auth: {
      // Pour fonctionner avec deno hors du navigateur.
      persistSession: false,
    },
  },
);
