import {useAuthHeaders} from 'core-logic/api/auth/useCurrentSession';

const BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api/v1`;

type API_ARGS = {route: string; params?: Record<string, string | number>};

/** Expose un client pour accéder au nouveau backend en attendant de pouvoir intégrer tRPC */
export const useApiClient = () => {
  const authHeaders = useAuthHeaders();

  // construit l'url pour la route et les paramètres donnés
  const makeUrl = ({route, params}: API_ARGS) => {
    const url = new URL(`${BASE_URL}${route}`);
    if (params) {
      Object.entries(params).forEach(([name, value]) =>
        url.searchParams.set(name, value.toString())
      );
    }
    return url;
  };

  // fait un appel GET
  const get = async <ResponseType>(args: API_ARGS) => {
    const response = await fetch(makeUrl(args), {
      headers: {
        'content-type': 'application/json',
        ...authHeaders,
      },
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(`${body.message} (${response.status})`);
    }
    return body as ResponseType;
  };

  // fait un appel GET pour télécharger un fichier
  const getAsBlob = async (args: API_ARGS) => {
    const response = await fetch(makeUrl(args), {
      headers: {
        ...authHeaders,
      },
    });
    if (!response.ok) {
      throw new Error(`Download error (${response.status})`);
    }
    // récupère la réponse sous forme de blob
    const blob = await response.blob();
    // essaye d'extraire le nom de fichier des en-têtes
    const filename = response.headers
      .get('Content-Disposition')
      ?.match(/filename="(.*)"/)?.[1];
    return {blob, filename};
  };

  // fait un appel POST
  const post = async <ResponseType>({route, params}: API_ARGS) => {
    const response = await fetch(makeUrl({route}), {
      method: 'POST',
      body: JSON.stringify(params),
      headers: {
        'content-type': 'application/json',
        ...authHeaders,
      },
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(`${body.message} (${response.status})`);
    }
    return body as ResponseType;
  };

  return {
    get,
    getAsBlob,
    post,
  };
};