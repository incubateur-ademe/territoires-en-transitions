import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Envoi le contenu d'une `table` ou d'une vue en csv
 * à un endpoint `sync` Airtable en utilisant un `token` perso.
 *
 * https://airtable.com/developers/web/api/post-sync-api-endpoint
 */
serve(async (req) => {
  if (
    req.headers.get("authorization") !==
    `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
  ) {
    // Seule la service key permet d'exécuter cette fonction.
    return new Response("Execute access forbidden", { status: 403 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    // Utilise le service role afin de récupérer les DCPs.
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      db: {
        schema: "public",
      },
      auth: {
        // Pour fonctionner avec deno hors du navigateur.
        persistSession: false,
      },
    }
  );

  const { token, table, sync } = await req.json();

  // Récupère les données de la table au format csv.
  const csvResponse = await supabase.from(table).select().csv();

  // Envoie les données à Airtable vers l'endpoint sync.
  const syncResponse = await fetch(sync, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/csv",
    },
    body: csvResponse.data,
  });

  const { success } = await syncResponse.json();

  // Renvoie le statut pour persister dans les logs Supabase.
  return new Response(
    JSON.stringify({
      status: syncResponse.status,
      success: success,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});
