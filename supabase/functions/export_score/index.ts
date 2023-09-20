import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { exportXLSX } from './exportXLSX.ts';

serve(async (req) => {
  // permet l'appel de la fonction depuis le navigateur
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { collectivite_id, referentiel } = await req.json();

  try {
    const supabaseClient = getSupabaseClient(req);
    const buffer = await exportXLSX(
      supabaseClient,
      collectivite_id,
      referentiel
    );
    if (!buffer) {
      throw Error('Export failed');
    }

    // renvoi les données exportées
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    return new Response(blob, {
      headers: {
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders },
      status: 400,
    });
  }
});
