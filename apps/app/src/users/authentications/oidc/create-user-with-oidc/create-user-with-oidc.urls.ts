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
