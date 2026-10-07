/**
 * Ne conserve `next` que s'il s'agit d'un chemin relatif interne sûr.
 *
 * `next` vient de la query string, donc potentiellement d'un attaquant : sans
 * ce filtre, `?next=//evil.example` redirige hors du domaine après
 * authentification (open redirect). Les trois conditions comptent — `//host`
 * est une URL protocole-relative, et `\` est normalisé en `/` par certains
 * navigateurs.
 *
 * Miroir de `sanitizeNextPath` côté backend
 * (`apps/backend/src/users/authentications/oidc/oidc.utils.ts`), que le
 * backend ne peut pas importer d'ici.
 */
export function sanitizeNextPath(
  next: string | null | undefined
): string | undefined {
  if (typeof next !== 'string' || !next) {
    return undefined;
  }
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return undefined;
  }
  return next;
}
