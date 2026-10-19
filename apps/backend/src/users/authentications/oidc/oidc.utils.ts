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
