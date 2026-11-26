import type { Request } from 'express';

/**
 * Cookies de la requête, sous forme de `Map`. Utilise `req.cookies` si le
 * middleware cookie-parser est installé, sinon parse l'en-tête `Cookie`
 * directement — le flux OIDC ne dépend donc pas de la présence de cookie-parser
 * dans `main.ts`.
 *
 * On renvoie une `Map` (et non un objet indexé) : les noms de cookie viennent
 * du client, une `Map` évite l'injection de propriété / la pollution de
 * prototype qu'un `obj[nomClient] = …` exposerait.
 */
export function getRequestCookies(req: Request): Map<string, string> {
  const parsed = (req as Request & { cookies?: Record<string, string> })
    .cookies;
  if (parsed && Object.keys(parsed).length > 0) {
    return new Map(Object.entries(parsed));
  }

  const header = req.headers.cookie;
  if (!header) {
    return new Map();
  }

  const cookies = new Map<string, string>();
  for (const part of header.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const name = part.slice(0, separatorIndex).trim();
    const rawValue = part.slice(separatorIndex + 1).trim();
    if (!name) {
      continue;
    }
    try {
      cookies.set(name, decodeURIComponent(rawValue));
    } catch {
      cookies.set(name, rawValue);
    }
  }
  return cookies;
}

/**
 * Ne conserve `next` que s'il s'agit d'un chemin relatif sûr (commence par `/`
 * sans être protocole-relatif `//`).
 * TODO : accepter aussi les URLs absolues same-root-domain.
 */
export function sanitizeNextPath(next: unknown): string | undefined {
  if (typeof next !== 'string' || !next) {
    return undefined;
  }
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return undefined;
  }
  return next;
}

/**
 * Domaine racine dérivé de l'APP_URL pour le cookie `oidc-id-token` (partagé
 * entre `app.*` et `api.*`). `undefined` (cookie host-only) pour localhost et
 * les IPs. Equivalent Nest de `getRootDomain` de packages/api (inutilisable
 * ici : il dépend de l'ENV client Next).
 */
export function getRootDomainFromUrl(url: string): string | undefined {
  const hostname = new URL(url).hostname;

  if (
    hostname === 'localhost' ||
    /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
  ) {
    return undefined;
  }

  const parts = hostname.split('.');
  if (parts.length < 3) {
    return hostname;
  }
  return parts.slice(-2).join('.');
}

/**
 * Quand le flux OIDC revient sur l'origine de l'app (redirect URI déclarée sur
 * `APP_URL`, backend joint par le proxy `/api`), il doit aussi en partir : les
 * cookies du flux et la session sont limités à cet hôte. Renvoie l'URL
 * équivalente sur l'origine de l'app pour une requête arrivée par un autre
 * hôte (`api.*`), `null` si elle est déjà au bon endroit.
 *
 * L'hôte d'arrivée est celui transmis par le proxy (`X-Forwarded-Host`).
 */
export function getOidcFlowRedirectUrl({
  req,
  appUrl,
  redirectUri,
}: {
  req: Pick<Request, 'headers' | 'originalUrl'>;
  appUrl: string;
  redirectUri: string;
}): string | null {
  const flowUrl = new URL(redirectUri);
  if (flowUrl.origin !== new URL(appUrl).origin) {
    return null;
  }
  const forwardedHost = [req.headers['x-forwarded-host']]
    .flat()[0]
    ?.split(',')[0]
    .trim();
  const requestHost = forwardedHost || req.headers.host;
  return requestHost === flowUrl.host
    ? null
    : `${flowUrl.origin}${req.originalUrl}`;
}
