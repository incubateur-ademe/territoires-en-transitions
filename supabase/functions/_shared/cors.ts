/**
 * En-tête à utiliser pour permettre l'appel d'une fonction depuis le navigateur
 * Ref: https://supabase.com/docs/guides/functions/cors#recommended-setup
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, content-disposition',
};
