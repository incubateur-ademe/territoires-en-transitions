/**
 * Provider ayant ouvert la session courante, posé par le backend au callback
 * (`OIDC_COOKIES.provider`, cookie non httpOnly). Même nom que dans
 * `packages/api/.../sign-out-user.server.ts` : les deux côtés lisent le cookie
 * du backend, aucun ne le possède.
 */
export const OIDC_PROVIDER_COOKIE = 'oidc-provider';

/**
 * Marqueur one-shot « une connexion par fournisseur d'identité vient
 * d'aboutir », posé par le pont de session `app/(public)/auth/verify/route.ts`
 * et consommé par `TrackLoginUserWithOidc`.
 *
 * Cookie plutôt que paramètre d'URL (le motif retenu pour `comptes-associes`) :
 * la destination d'après connexion est quelconque, et un second paramètre à
 * nettoyer entrerait en concurrence avec le premier — deux `router.replace`
 * construits sur le même instantané de `searchParams` se réécrasent.
 */
export const OIDC_LOGIN_COOKIE = 'oidc-connexion';

/** Le temps d'arriver sur la page de destination, pas plus. */
export const OIDC_LOGIN_COOKIE_TTL_S = 300;

/**
 * Le cookie provider est modifiable côté client : on ne le renvoie que s'il
 * ressemble à un nom de provider, jamais tel quel dans un événement de suivi.
 */
export const asProviderName = (value: string | undefined): string =>
  value && /^[a-z]+$/.test(value) ? value : 'inconnu';
