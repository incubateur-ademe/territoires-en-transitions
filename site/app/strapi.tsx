const baseURL = process.env.NEXT_PUBLIC_STRAPI_URL;
const apiKey = process.env.NEXT_PUBLIC_STRAPI_KEY;

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`,
};

type collection = 'actualites';
type id = number;

export async function fetchCollection(path: collection): Promise<Array<JSON>> {
  const url = `${baseURL}/api/${path}?populate=*`;

  const response = await fetch(`${url}`, {
    method: 'GET',
    headers,
  });
  const body = await response.json();
  return body['data'];
}

export async function fetchItem(path: string, id: id): Promise<JSON> {
  const url = `${baseURL}/api/${path}/${id}`;

  const response = await fetch(`${url}`, {
    method: 'GET',
    headers,
  });
  const body = await response.json();
  return body['data'];
}
