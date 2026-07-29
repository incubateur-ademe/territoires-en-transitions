/**
 * Constructeurs d'URL purs du parcours de liaison d'identité OIDC.
 *
 * Isolés dans un module sans dépendance React/Next pour rester testables
 * unitairement — le repo n'a pas de test de composant connecté à
 * tRPC/React-Query, donc la logique non triviale vit ici plutôt que dans les
 * vues.
 */

/**
 * URL de la page `confirmer-session` (cas « Oui, déjà un compte »). L'écran de
 * reconnexion pose la session Supabase puis navigue ici (navigation dure) ; la
 * page relie alors l'identité OIDC portée par le ticket au compte existant.
 */
export function buildConfirmSessionUrl(args: {
  appUrl: string;
  ticket: string;
  next?: string;
}): string {
  const { appUrl, ticket, next } = args;
  const url = new URL('/auth/proconnect/confirmer-session', appUrl);
  url.searchParams.set('ticket', ticket);
  if (next) {
    url.searchParams.set('next', next);
  }
  return url.toString();
}

/**
 * Ajoute `comptes-associes=1` à un chemin relatif — le signal one-shot lu par
 * `ToastLiaisonComptes`, déjà posé par `app/(public)/auth/verify/route.ts` pour
 * les liaisons automatiques. On l'applique aussi après la liaison assistée pour
 * une UX cohérente entre tous les parcours.
 *
 * L'origine bidon sert uniquement à parser un chemin relatif, que `URL` ne sait
 * pas prendre seul ; elle est jetée avant de renvoyer.
 */
export function appendLinkedAccountsParam(path: string): string {
  const url = new URL(path, 'http://internal.invalid');
  url.searchParams.set('comptes-associes', '1');
  return `${url.pathname}${url.search}`;
}
