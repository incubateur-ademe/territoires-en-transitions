import {StrapiItem} from './StrapiItem';

const baseURL = process.env.NEXT_PUBLIC_STRAPI_URL;
const apiKey = process.env.NEXT_PUBLIC_STRAPI_KEY;

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`,
};

type Collection = 'actualites';

export async function fetchCollection(
  path: Collection
): Promise<Array<StrapiItem>> {
  const url = `${baseURL}/api/${path}?populate=*`;

  const response = await fetch(`${url}`, {
    method: 'GET',
    headers,
  });
  const body = await response.json();
  return body['data'];
}

export async function fetchItem(path: string, id: number): Promise<StrapiItem> {
  const url = `${baseURL}/api/${path}/${id}?populate=*`;

  const response = await fetch(`${url}`, {
    method: 'GET',
    headers,
  });
  const body = await response.json();
  return body['data'];
}
