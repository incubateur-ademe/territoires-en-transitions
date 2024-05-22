/**
 * Exporte un plan d'actions
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { exportXLSX } from './exportXLSX.ts';
import { exportDOCX } from './exportDOCX.ts';
import { exportDOCXFiche } from './exportDOCXFiche.ts';

serve(async (req) => {
  // permet l'appel de la fonction depuis le navigateur
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { planId, ficheId, format } = await req.json();

  try {
    const supabaseClient = getSupabaseClient(req);

    // exporte les données dans le format voulu
    let data;
    if (format === 'xlsx') {
      data = await exportXLSX(supabaseClient, planId);
    }
    if (format === 'docx') {
      if (planId) {
        data = await exportDOCX(supabaseClient, planId);
      } else if (ficheId) {
        data = await exportDOCXFiche(supabaseClient, ficheId);
      }
    }
    if (!data) {
      throw Error('Export failed');
    }

    // renvoi les données exportées
    const { buffer, filename } = data;
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    return new Response(blob, {
      headers: {
        ...corsHeaders,
        "Content-disposition": `attachment; filename=${encodeURI(filename)}`,
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
