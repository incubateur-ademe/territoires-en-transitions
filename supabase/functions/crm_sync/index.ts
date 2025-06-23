import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClientWithServiceRole } from '../_shared/getSupabaseClient.ts';

/**
 * Envoi le contenu d'une `table` ou d'une vue en csv
 * à un endpoint `sync` Airtable en utilisant un `token` perso.
 *
 * https://airtable.com/developers/web/api/post-sync-api-endpoint
 */
serve(async (req) => {
  if (
    req.headers.get('authorization') !==
    `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
  ) {
    // Seule la service key permet d'exécuter cette fonction.
    return new Response('Execute access forbidden', { status: 403 });
  }

  const supabase = getSupabaseClientWithServiceRole();

  const { token, table, sync } = await req.json();

  // Récupère les données de la table au format csv.
  const { error, data, count } = await supabase
    .from(table)
    .select('*', { count: 'exact' })
    .range(0, 4999)
    .csv();

  let allData = data;

  const handleError = (error) => {
    console.log(JSON.stringify({ error, table }));

    return new Response(
      JSON.stringify({
        status: 500,
        error,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  if (error) {
    return handleError(error);
  }

  if (count > 5000) {
    const { error, data: dataOver5000 } = await supabase
      .from(table)
      .select('*')
      .range(5000, 9999)
      .csv();

    allData += '\n' + dataOver5000.replace(/.*\n/, '') /* remove header */;
    if (error) {
      return handleError(error);
    }
  }

  // Envoie les données à Airtable vers l'endpoint sync.
  const syncResponse = await fetch(sync, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/csv',
    },
    body: allData,
  });

  if (!syncResponse.ok) {
    return handleError({
      status: syncResponse.status,
      statusText: syncResponse.statusText,
    });
  }

  const { success } = await syncResponse.json();
  console.log(
    JSON.stringify({
      success,
      table,
      nbOfRows: allData.split('\n').length - 1 /* without header */,
    })
  );

  // Renvoie le statut pour persister dans les logs Supabase.
  return new Response(
    JSON.stringify({
      status: syncResponse.status,
      success: success,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
