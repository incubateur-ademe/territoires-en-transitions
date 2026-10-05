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

// Strapi 5 ignore sans erreur les `populate[0]=champ` d'une requête dont le
// même niveau contient aussi un `populate[champ][…]` : le champ revient null.
// Un même niveau s'écrit donc soit tout en tableau, soit tout en objet
// (`populate[champ]=true`). Vérifié à chaque niveau d'imbrication.
const assertPopulateNotMixed = (params: Params) => {
  const kindsByLevel = new Map<string, Set<'index' | 'name'>>();
  for (const [key] of params) {
    if (!key.startsWith('populate')) continue;
    const segments = [
      'populate',
      ...[...key.matchAll(/\[([^\]]*)\]/g)].map((match) => match[1]),
    ];
    segments.forEach((segment, index) => {
      if (index === 0 || segments[index - 1] !== 'populate') return;
      const level = segments.slice(0, index).join('.');
      const kinds = kindsByLevel.get(level) ?? new Set();
      kinds.add(/^\d+$/.test(segment) ? 'index' : 'name');
      kindsByLevel.set(level, kinds);
    });
  }
  const mixedLevels = [...kindsByLevel]
    .filter(([, kinds]) => kinds.size > 1)
    .map(([level]) => level);
  if (mixedLevels.length) {
    throw new Error(
      `Strapi : populate mixte (populate[n] et populate[champ]) sous ${mixedLevels.join(
        ', '
      )}`
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

/** `documentId` Strapi 5 : identifiant cuid2, minuscules et chiffres. */
const DOCUMENT_ID_PATTERN = /^[a-z0-9]{10,32}$/;

/**
 * Une entrée par son `documentId` (l'`id` numérique n'est plus accepté dans
 * l'URL). Le `documentId` vient souvent du chemin de la page : validé, il ne
 * peut pas détourner la requête vers une autre route de l'API (SSRF).
 */
export async function fetchItem<T>(
  path: Collection,
  documentId: string,
  params: Params = [['populate', '*']]
): Promise<StrapiEntry<T> | null> {
  if (!DOCUMENT_ID_PATTERN.test(documentId)) return null;

  const url = buildUrl(`${path}/${encodeURIComponent(documentId)}`, params);
  const response = await fetch(url, {
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
