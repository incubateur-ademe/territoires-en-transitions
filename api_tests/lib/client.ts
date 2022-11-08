import { createClient } from "https://deno.land/x/supabase/mod.ts";

/**
 * Supabase client
 */
export const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_KEY")!,
  {
    schema: "public",
  },
);
