const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Fetch un seul objet
 *
 * équivalent de `supabase.from(x).single()`
 * @param path
 */
export const singleFetcher = (path: string) => fetch(
  `${apiUrl}/${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      apiKey: apiKey,
      Accept: 'application/vnd.pgrst.object+json',
    },
  }).then((res) => res.json());

/**
 * Fetch un point d'api supabase
 *
 * @param path
 */
export const fetcher = (path: string) => fetch(
  `${apiUrl}/${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      apiKey: apiKey,
      Accept: 'application/json',
    },
  }).then((res) => res.json());
