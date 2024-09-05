import {corsHeaders} from "../_shared/cors.ts";
import {saveActionsImpact, savePartenaires} from "./saveData.ts";
import {getSupabaseClientWithServiceRole} from "../_shared/getSupabaseClient.ts";

Deno.serve(async (req) => {
  // permet l'appel de la fonction depuis le navigateur
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (
      req.headers.get('authorization') !==
      `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
  ) {
    // Seule la service key permet d'exécuter cette fonction.
    return new Response('Execute access forbidden', { status: 403 });
  }
  const supabaseClient = getSupabaseClientWithServiceRole();

  // MàJ des partenaires
  await savePartenaires(supabaseClient);
  // MàJ des actions à impact
  await saveActionsImpact(supabaseClient);


  return new Response(
    'ok',
    { headers: { "Content-Type": "application/json" } },
  )
})
