import { sanitizeNextPath } from '../../sanitize-next-path';

/**
 * URL de départ du parcours de création de compte : le flux OIDC classique
 * assorti de `intent=creation`, qui fait poser au backend le cookie
 * `oidc-signup-intent`. Au retour du fournisseur, si aucun compte ne
 * correspond, le compte est créé directement au lieu d'afficher l'écran
 * « aviez-vous déjà un compte ? ».
 *
 * `next` est filtré par `sanitizeNextPath` : il vient du `redirect_to` de la
 * query string, donc potentiellement d'un attaquant (open redirect).
 */
export function buildSignupWithOidcUrl(args: {
  backendUrl: string;
  provider: string;
  next?: string | null;
}): string {
  const { backendUrl, provider, next } = args;
  const url = new URL(`/api/v1/${provider}/login`, backendUrl);
  url.searchParams.set('intent', 'creation');

  const nextPath = sanitizeNextPath(next);
  if (nextPath) {
    url.searchParams.set('next', nextPath);
  }
  return url.toString();
}

/**
 * URL du endpoint backend qui crée le compte depuis le ticket OIDC, pose la
 * session et redirige lui-même vers l'app — cas « Non, jamais eu de compte »
 * de l'écran de bienvenue.
 *
 * Redirection navigateur simple (`window.location.href`), jamais un appel API :
 * c'est le backend qui pose les cookies de session.
 */
export function buildCreateUserUrl(args: {
  backendUrl: string;
  ticket: string;
  next?: string;
}): string {
  const { backendUrl, ticket, next } = args;
  const url = new URL('/api/v1/auth/proconnect/creer-compte', backendUrl);
  url.searchParams.set('ticket', ticket);
  if (next) {
    url.searchParams.set('next', next);
  }
  return url.toString();
}
