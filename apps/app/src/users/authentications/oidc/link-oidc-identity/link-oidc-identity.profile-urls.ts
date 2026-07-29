/**
 * Fonctions pures pour la section « Méthodes de connexion » du profil :
 * construction de l'URL de liaison volontaire (`mode=link`) et mapping des
 * codes d'erreur `erreur-liaison` renvoyés par le callback OIDC
 * (`apps/backend/src/users/authentications/oidc/oidc.controller.ts`).
 *
 * Isolées ici sans dépendance React/Next pour rester testables unitairement —
 * même logique que `users/authentications/link-oidc-identity/link-oidc-identity.urls.ts`.
 */

/**
 * URL du endpoint backend qui initie le flux OIDC en mode « liaison
 * volontaire » depuis le profil. Redirection navigateur simple
 * (`window.location.href`), jamais un appel API — le backend redirige
 * lui-même vers `${APP_URL}/profil?comptes-associes=1` (succès) ou
 * `${APP_URL}/profil?erreur-liaison=<code>` (échec) une fois l'aller-retour
 * chez le fournisseur terminé.
 */
export function buildLinkIdentityUrl(args: {
  backendUrl: string;
  provider: string;
  next: string;
}): string {
  const { backendUrl, provider, next } = args;
  const url = new URL(`/api/v1/${provider}/login`, backendUrl);
  url.searchParams.set('mode', 'link');
  url.searchParams.set('next', next);
  return url.toString();
}

/**
 * Codes d'erreur de liaison volontaire pouvant atterrir sur
 * `/profil?erreur-liaison=<code>` — sous-ensemble de `oidcErrorCodes`
 * (`apps/backend/src/users/authentications/oidc/oidc.models.ts`) que le
 * callback peut effectivement produire pour ce parcours.
 */
export const linkIdentityErrorCodes = [
  'oidc-identite-deja-liee-ailleurs',
  'oidc-compte-supprime',
] as const;

export type LinkIdentityErrorCode = (typeof linkIdentityErrorCodes)[number];

export function isLinkIdentityErrorCode(
  code: string
): code is LinkIdentityErrorCode {
  return (linkIdentityErrorCodes as readonly string[]).includes(code);
}
