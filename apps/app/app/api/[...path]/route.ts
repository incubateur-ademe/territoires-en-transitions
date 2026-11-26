import { ENV } from '@tet/api/environmentVariables';
import type { NextRequest } from 'next/server';

/**
 * Relaie `app.…/api/*` vers le backend, chemin conservé : le navigateur ne
 * parle qu'à l'origine de l'app, ce qui permet un cookie de session limité à
 * cet hôte. Utilisé quand `BACKEND_BROWSER_URL` vaut l'origine de l'app.
 *
 * Là où un reverse proxy route déjà `/api` vers le backend (Traefik sur
 * Coolify), ce fichier n'est jamais atteint.
 */
const REQUEST_HEADERS_TO_DROP = [
  'host',
  // Refusé par `fetch` (curl l'envoie sur les gros corps).
  'expect',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'content-length',
  // `fetch` négocie et décompresse lui-même.
  'accept-encoding',
];

// Le corps relayé est déjà décompressé par `fetch`.
const RESPONSE_HEADERS_TO_DROP = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'keep-alive',
];

/** Retire `names` et les en-têtes que `Connection` réserve au saut précédent (RFC 9110, 7.6.1). */
function dropHopByHopHeaders(headers: Headers, names: string[]): void {
  const namedByConnection = (headers.get('connection') ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter((name) => /^[\w!#$%&'*+.^`|~-]+$/.test(name));
  [...names, ...namedByConnection].forEach((name) => headers.delete(name));
}

async function proxyToBackend(request: NextRequest): Promise<Response> {
  const { pathname, search } = request.nextUrl;

  const headers = new Headers(request.headers);
  // `Host` et non `request.nextUrl.host` : en `standalone`, Next construit
  // l'URL de la requête avec son adresse d'écoute (`0.0.0.0:3000`).
  const publicHost = request.headers.get('host') ?? request.nextUrl.host;
  dropHopByHopHeaders(headers, REQUEST_HEADERS_TO_DROP);
  // Hôte d'arrivée, pour le backend (cf. `getOidcFlowRedirectUrl`) : sans lui,
  // il renverrait indéfiniment les flux OIDC vers l'origine de l'app.
  headers.set('x-forwarded-host', publicHost);

  const backendResponse = await fetch(
    `${ENV.backend_url?.replace(/\/+$/, '')}${pathname}${search}`,
    {
      method: request.method,
      headers,
      body: request.body,
      // Corps transmis en flux (envois de fichiers), redirections rendues
      // telles quelles au navigateur (flux OIDC).
      duplex: 'half',
      redirect: 'manual',
      signal: request.signal,
    } as RequestInit
  );

  const responseHeaders = new Headers(backendResponse.headers);
  dropHopByHopHeaders(responseHeaders, RESPONSE_HEADERS_TO_DROP);

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export const dynamic = 'force-dynamic';

export {
  proxyToBackend as DELETE,
  proxyToBackend as GET,
  proxyToBackend as HEAD,
  proxyToBackend as OPTIONS,
  proxyToBackend as PATCH,
  proxyToBackend as POST,
  proxyToBackend as PUT,
};
