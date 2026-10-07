import { sanitizeNextPath } from '../../sanitize-next-path';

/**
 * URL de départ d'une connexion par fournisseur d'identité.
 *
 * `next` porte la destination d'après authentification : sans lui, le backend
 * ramène sur la racine et le `redirect_to` de la page de connexion est perdu —
 * une invitation ouverte depuis un mail ne serait jamais consommée.
 *
 * `next` vient de la query string, donc potentiellement d'un attaquant : il est
 * filtré par `sanitizeNextPath` (open redirect). La racine est omise, c'est
 * déjà la destination par défaut du backend.
 */
export function buildLoginWithOidcUrl(args: {
  backendUrl: string;
  provider: string;
  next?: string | null;
}): string {
  const { backendUrl, provider, next } = args;
  const url = new URL(`/api/v1/${provider}/login`, backendUrl);

  const nextPath = sanitizeNextPath(next);
  if (nextPath && nextPath !== '/') {
    url.searchParams.set('next', nextPath);
  }
  return url.toString();
}
