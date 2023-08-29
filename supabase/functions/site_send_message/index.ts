import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/getSupabaseClient.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 *
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const supabase = getSupabaseClient(req);

  const { nom, email } = await req.json();

  // Renvoie le statut pour persister dans les logs Supabase.
  return new Response(
    JSON.stringify({
      status: 200,
      success: true,
      digest: `Un email à été envoyé par ${nom} ${email}`,
    }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    },
  );
});
