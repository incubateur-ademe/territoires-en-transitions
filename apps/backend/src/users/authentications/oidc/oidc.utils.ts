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
