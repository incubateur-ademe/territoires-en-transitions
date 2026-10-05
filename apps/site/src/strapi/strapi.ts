import { StrapiCollection, StrapiEntry, StrapiMedia } from './types';

const baseURL = process.env.NEXT_PUBLIC_STRAPI_URL;
const apiKey = process.env.NEXT_PUBLIC_STRAPI_KEY;

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`,
};

type Collection =
  | 'actualites'
  | 'actualites-categories'
  | 'collectivites'
  | 'conseillers'
  | 'faqs'
  | 'services'
  | 'legals'
  | 'temoignages';

type Single =
  | 'page-accueil'
  | 'page-budget'
  | 'page-collectivite'
  | 'page-contact'
  | 'page-demarche-pcaet'
  | 'page-programme'
  | 'page-outils-numerique'
  | 'page-trajectoire';

type Params = [string, string][];

// Strapi 5 ignore sans erreur les `populate[0]=champ` d'une requête qui
// contient aussi un `populate[champ][…]` : le champ revient null. Dans ce cas,
// tout s'écrit en forme objet (`populate[champ]=true`).
const assertPopulateNotMixed = (params: Params) => {
  const keys = params.map(([key]) => key).filter((key) => key.startsWith('populate['));
  const indexed = keys.some((key) => /^populate\[\d+\]$/.test(key));
  const named = keys.some((key) => /^populate\[[^\d\]][^\]]*\]/.test(key));
  if (indexed && named) {
    throw new Error(
      `Strapi populate mixte (populate[n] et populate[champ]) : ${keys.join(', ')}`
    );
  }
};

const buildUrl = (path: string, params: Params) => {
  assertPopulateNotMixed(params);
  const url = new URL(`${baseURL}/api/${path}`);
  params.forEach((p) => url.searchParams.append(...p));
  return url.toString();
};

export async function fetchCollection<T>(
  path: Collection,
  params: Params = [['populate', '*']]
): Promise<StrapiCollection<T>> {
  const response = await fetch(buildUrl(path, params), {
    next: { revalidate: 3600 },
    method: 'GET',
    headers,
  });
  return response.json();
}

export async function fetchSingle<T>(
  path: Single,
  params: Params = [['populate', '*']]
): Promise<StrapiEntry<T> | null> {
  const response = await fetch(buildUrl(path, params), {
    cache: 'no-store',
    method: 'GET',
    headers,
  });
  const body = await response.json();
  return body.data ?? null;
}

/** Une entrée par son `documentId` (l'`id` numérique n'est plus accepté dans l'URL). */
export async function fetchItem<T>(
  path: Collection,
  documentId: string,
  params: Params = [['populate', '*']]
): Promise<StrapiEntry<T> | null> {
  const response = await fetch(buildUrl(`${path}/${documentId}`, params), {
    next: { revalidate: 3600 },
    method: 'GET',
    headers,
  });
  const body = await response.json();
  return body.data ?? null;
}

/** Un fichier de la médiathèque par son `id` numérique (les fichiers ne sont pas des documents). */
export async function fetchImage(id: number): Promise<StrapiMedia> {
  const response = await fetch(buildUrl(`upload/files/${id}`, []), {
    next: { revalidate: 3600 },
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`fetchImage failed (${response.status}) for id=${id}`);
  }
  return response.json();
}
