import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import pl from 'https://esm.sh/nodejs-polars@0.8.1';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { exportXLSX } from '../export_plan_action/exportXLSX.ts';

/**
 * Importe (xls) une nouvelle version d'un plan d'actions existant
 */
serve(async (req) => {
  // permet l'appel de la fonction depuis le navigateur
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { planId, file } = await req.json();

  try {
    const supabaseClient = getSupabaseClient(req);

    // exporte les données existantes
    const data = await exportXLSX(supabaseClient, planId, 'csv');
    if (!data) {
      throw Error('Export failed');
    }

    // compare les données existantes à celles du fichier uploadé
    // pl.readCSV(data.buffer);

    // met à jour la base avec les différences

    // renvoi ok
    return new Response('ok', {
      headers: { ...corsHeaders },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders },
      status: 400,
    });
  }
});
