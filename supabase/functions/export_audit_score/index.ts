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

// To invoke:
/* curl --location --request POST 'http://localhost:54321/functions/v1/export_audit_score' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  --header 'Content-Type: application/json' \
  --data '{"collectivite_id": 1, "referentiel": "eci"}' \
  --output ~/Downloads/tmp.xlsx
 */
