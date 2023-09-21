/**
 * Utilitaires pour exposer des fonctions appelables depuis le navigateur par un compte authentifié.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, TSupabaseClient } from './getSupabaseClient.ts';
import { corsHeaders } from './cors.ts';

type TPublicFunction = <T>(
  supabaseClient: TSupabaseClient,
  args: T
) => Promise<Response>;

/** Expose une fonction appelable par le navigateur */
export const servePublicFunction = (func: TPublicFunction) =>
  serve(async (req) => {
    // permet l'appel de la fonction depuis le navigateur
    if (req.method === 'OPTIONS') {
      return corsResponse();
    }

    try {
      const supabaseClient = getSupabaseClient(req);
      const args = await req.json();

      // renvoi la réponse générée par le callback fourni
      return func(supabaseClient, args);
    } catch (error) {
      return errorResponse(error);
    }
  });

type TExportFunction = <T>(
  supabaseClient: TSupabaseClient,
  args: T
) => Promise<BlobPart>;

/** Expose une fonction générant un export */
export const serveExportFunction = (func: TExportFunction) =>
  servePublicFunction(async (supabaseClient, args) => {
    const buffer = await func(supabaseClient, args);
    return blobResponse(buffer);
  });

// retourne uniquement les en-têtes CORS (pour répondre à une requête OPTIONS)
const corsResponse = () => new Response('ok', { headers: corsHeaders });

// retourne un blob
const blobResponse = (part: BlobPart) => {
  if (!part) {
    throw Error('Données non valides');
  }

  const blob = new Blob([part], { type: 'application/octet-stream' });
  return new Response(blob, {
    headers: {
      ...corsHeaders,
    },
  });
};

// retourne une erreur dans une réponse http
const errorResponse = (error: Error) => {
  console.error(error);
  return new Response(JSON.stringify({ error: error.message }), {
    headers: { ...corsHeaders },
    status: 400,
  });
};
