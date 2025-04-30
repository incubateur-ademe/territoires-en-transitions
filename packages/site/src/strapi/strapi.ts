import { StrapiItem } from './StrapiItem';

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
  | 'page-programme'
  | 'page-outils-numerique'
  | 'page-trajectoire';

export async function fetchCollection(
  path: Collection,
  params: [string, string][] = [['populate', '*']]
): Promise<{
  data: Array<StrapiItem>;
  meta: { pagination: { start: number; limit: number; total: number } };
}> {
  const url = new URL(`${baseURL}/api/${path}`);
  params.forEach((p) => url.searchParams.append(...p));

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 },
    method: 'GET',
    headers,
  });
  const body = await response.json();
  return body;
}

export const fetchSingle = async (
  path: Single,
  params: [string, string][] = [['populate', '*']]
): Promise<StrapiItem> => {
  const url = new URL(`${baseURL}/api/${path}`);
  params.forEach((p) => url.searchParams.append(...p));

  const response = await fetch(`${url}`, {
    cache: 'no-store',
    method: 'GET',
    headers,
  });
  const body = await response.json();
  return body.data;
};

export async function fetchItem(
  path: string,
  id: number,
  params: [string, string][] = [['populate', '*']]
): Promise<StrapiItem> {
  const url = new URL(`${baseURL}/api/${path}/${id}`);
  params.forEach((p) => url.searchParams.append(...p));

  const response = await fetch(`${url}`, {
    next: { revalidate: 3600 },
    method: 'GET',
    headers,
  });
  const body = await response.json();
  return body['data'];
}
