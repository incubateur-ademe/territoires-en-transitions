import { ENV } from '@tet/api/environmentVariables';
import { useUserContext } from '@tet/api/users';
import { isNil } from 'es-toolkit';
import { getFileNameFromResponse } from './get-filename-from-response';

type JSONValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

type API_ARGS = {
  route: string;
  params?: JSONValue;
  signal?: AbortSignal;
};

type ResponseError = {
  status: number;
  message: string;
  timestamp: string;
  path: string;
};

class ApiError extends Error {
  statusCode: number;

  constructor({ message, status }: ResponseError) {
    super(message);
    this.statusCode = status;
  }
}

/** Expose un client pour accéder au nouveau backend en attendant de pouvoir intégrer tRPC */
export const useApiClient = () => {
  const { authHeaders } = useUserContext();

  // construit l'url pour la route et les paramètres donnés
  const makeUrl = ({ route, params }: API_ARGS) => {
    const url = new URL(`${ENV.backend_url}/api/v1${route}`);
    if (params) {
      Object.entries(params).forEach(([name, value]) => {
        if (!isNil(value))
          url.searchParams.set(
            name,
            Array.isArray(value) ? value.join(',') : value.toString()
          );
      });
    }
    return url;
  };

  // fait un appel GET
  const get = async <ResponseType>(args: API_ARGS) => {
    const response = await fetch(makeUrl(args), {
      signal: args.signal,
      headers: {
        'content-type': 'application/json',
        ...authHeaders,
      },
    });
    const body = await response.json();
    if (!response.ok) {
      throw new ApiError(body);
    }
    return body as ResponseType;
  };

  // fait un appel GET (ou POST) pour télécharger un fichier
  const getAsBlob = async (
    { route, params, signal }: API_ARGS,
    method: 'POST' | 'GET' = 'GET'
  ) => {
    const response = await fetch(
      method === 'GET' ? makeUrl({ route, params }) : makeUrl({ route }),
      {
        method,
        signal,
        headers: {
          'content-type': 'application/json',
          ...authHeaders,
        },
        body: method === 'GET' ? undefined : JSON.stringify(params),
      }
    );
    if (!response.ok) {
      const body = await response.json();
      throw new ApiError(body);
    }
    // récupère la réponse sous forme de blob
    const blob = await response.blob();

    // essaye d'extraire le nom de fichier des en-têtes
    const filename = getFileNameFromResponse(response);
    return { blob, filename };
  };

  // renvoie une fonction permettant de faire une requête d'écriture (POST ou PUT ou DELETE)
  const createWriteRequest =
    (method: 'POST' | 'PUT' | 'DELETE') =>
    async <ResponseType>({ route, params, signal }: API_ARGS) => {
      const response = await fetch(makeUrl({ route }), {
        method,
        signal,
        body: JSON.stringify(params),
        headers: {
          'content-type': 'application/json',
          ...authHeaders,
        },
      });
      const body = await response.json();
      if (!response.ok) {
        throw new ApiError(body);
      }
      return body as ResponseType;
    };

  const postFormData = async ({
    route,
    formData,
  }: {
    route: string;
    formData: FormData;
  }): Promise<unknown> => {
    const response = await fetch(makeUrl({ route }), {
      method: 'POST',
      body: formData,
      headers: { ...authHeaders },
    });
    const body = await response.json();
    if (!response.ok) {
      throw new ApiError(body);
    }
    return body;
  };

  return {
    get,
    getAsBlob,
    post: createWriteRequest('POST'),
    postFormData,
    put: createWriteRequest('PUT'),
    delete: createWriteRequest('DELETE'),
  };
};
