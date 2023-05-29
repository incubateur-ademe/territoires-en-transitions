import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  const { token, personnes } = await req.json();

  // Récupère les données au format csv.
  const dcpTable = await supabase.from("dcp").select().csv();

  // Envoie les données à Airtable.
  const personnesSync = await fetch(personnes, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/csv",
    },
    body: dcpTable.data,
  });

  // todo supprimer le retour de test
  const data = {
    status: personnesSync.status,
    text: await personnesSync.text(),
  };

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
