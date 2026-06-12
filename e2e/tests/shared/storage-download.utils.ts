import { createClient } from '@supabase/supabase-js';

function getSupabaseCredentials() {
  const url = process.env.SUPABASE_API_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('SUPABASE_API_URL and SUPABASE_ANON_KEY must be set');
  }
  return { url, anonKey };
}

/**
 * Reproduit l'appel Supabase Storage utilisé par l'UI (`openPreuve`) :
 * `supabase.storage.from(bucket_id).download(hash)`.
 */
export async function attemptSupabaseStorageDownload(
  accessToken: string,
  bucketId: string,
  hash: string
): Promise<{ ok: boolean; errorMessage?: string }> {
  const { url, anonKey } = getSupabaseCredentials();
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data, error } = await client.storage.from(bucketId).download(hash);

  if (data && !error) {
    return { ok: true };
  }

  return {
    ok: false,
    errorMessage: error?.message ?? 'download returned no data',
  };
}
