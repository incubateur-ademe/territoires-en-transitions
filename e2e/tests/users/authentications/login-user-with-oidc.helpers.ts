import { Page } from '@playwright/test';
import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

const baseApiURL = process.env.BASE_API_URL || 'http://localhost:8080';

let activeProvidersCache: Promise<boolean> | undefined;

/**
 * Un fournisseur d'identité est-il réellement configuré côté backend ?
 *
 * Quand c'est le cas, `/signup` redirige vers le fournisseur : les parcours de
 * création de compte par email + mot de passe ne sont plus atteignables et les
 * tests qui les exercent n'ont plus d'objet. La CI désactive les deux providers
 * (`MON_COMPTE_ADEME_ENABLED=false`, cf. `.github/workflows/test-e2e.yml`), le
 * dev local active MonCompteAdeme — d'où la bascule.
 *
 * La résolution du provider se fait côté serveur (RSC) : `enableOidcFront`, qui
 * n'intercepte que les requêtes tRPC du navigateur, ne peut rien y changer.
 */
export function hasActiveOidcProvider(): Promise<boolean> {
  activeProvidersCache ??= createTRPCClient<AppRouter>({
    links: [httpBatchLink({ url: `${baseApiURL}/trpc` })],
  })
    .users.authentications.oidc.listActiveProviders.query()
    .then((providers) => providers.length > 0)
    // Backend injoignable : `/signup` retombe de toute façon sur le formulaire.
    .catch(() => false);

  return activeProvidersCache;
}

/**
 * Enveloppe une valeur dans le format de réponse d'une query tRPC servie par
 * `httpLink` (non-batch, sans transformer superjson — cf.
 * `packages/api/src/utils/trpc/trpc-with-react-query.provider.tsx` et
 * `apps/backend/src/utils/trpc/trpc.service.ts`) : `{ result: { data } }`.
 */
const trpcQueryResponse = (data: unknown) => ({ result: { data } });

export type EnableOidcFrontOptions = {
  /**
   * Providers renvoyés par `listActiveProviders` (pilote les boutons OIDC des
   * écrans de connexion/inscription et du profil). Défaut : les deux.
   */
  activeProviders?: Array<'proconnect' | 'moncompteademe'>;
  /** Le compte courant a-t-il déjà lié MonCompteAdeme ? Défaut : non (incitation visible). */
  hasLinkedIdentity?: boolean;
  /** Le compte courant dispose-t-il d'un mot de passe utilisable ? Défaut : oui. */
  hasPassword?: boolean;
};

/**
 * Active MonCompteAdeme (et ProConnect) *côté client uniquement*, en
 * interceptant les réponses tRPC qui pilotent l'affichage OIDC — sans dépendre
 * des flags backend `*_ENABLED`. Le backend (y compris en CI, où MCA peut être
 * désactivé via `MON_COMPTE_ADEME_ENABLED=false`) n'a donc pas besoin d'être
 * configuré : le parcours d'incitation et les boutons de connexion restent
 * testables « à la volée ».
 *
 * ⚠️ Ne simule QUE l'affichage (providers actifs + statut de migration). Le vrai
 * aller-retour OIDC (échange de code avec l'IdP) n'est pas couvert — il est de
 * toute façon hors de portée en CI (pas d'IdP de test).
 *
 * À appeler AVANT toute navigation (`page.goto`) : les routes doivent être en
 * place au moment où la page émet ses requêtes.
 */
export async function enableOidcFront(
  page: Page,
  options: EnableOidcFrontOptions = {}
): Promise<void> {
  const {
    activeProviders = ['moncompteademe'],
    hasLinkedIdentity = false,
    hasPassword = true,
  } = options;

  // Boutons OIDC (connexion / inscription / profil) — `listActiveProviders`.
  await page.route(/\/trpc\/.*listActiveProviders/, (route) =>
    route.fulfill({ json: trpcQueryResponse(activeProviders) })
  );

  // Statut de migration « connexion unifiée ». Un seul pattern couvre les deux
  // procédures (`getStatus` public + `getUserStatus` authentifié — d'où le
  // `.*Status` : « getStatus » n'est pas une sous-chaîne de « getUserStatus ») :
  // la version publique ne lit que `enabled`, les champs en trop sont ignorés.
  await page.route(/\/trpc\/.*get(User)?Status/, (route) =>
    route.fulfill({
      json: trpcQueryResponse({
        targetProvider: 'moncompteademe',
        enabled: true,
        hasLinkedIdentity,
        hasPassword,
      }),
    })
  );
}
