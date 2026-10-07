/**
 * Configuration exposée au navigateur, lue **au runtime** et non figée au
 * build.
 *
 * Next.js inline `process.env.NEXT_PUBLIC_X` dans les bundles au moment du
 * `next build` : une image Docker construite avec ces variables est donc liée à
 * un environnement. Pour qu'une seule image puisse être promue de preprod à
 * prod, les valeurs transitent par deux canaux :
 *
 * - **serveur** : `process.env[KEY]`, sans préfixe. L'accès est *indexé
 *   dynamiquement*, ce que le bundler ne sait pas inliner — la valeur est donc
 *   bien relue dans l'environnement du conteneur.
 * - **navigateur** : un `<script>` posé par le layout racine remplit
 *   `window.__TET_PUBLIC_ENV__` avant l'exécution des bundles applicatifs
 *   (cf. `apps/app/app/public-env.script.tsx`).
 *
 * `apps/site` n'injecte rien : il retombe sur
 * `BUILD_TIME_FALLBACK`, c'est-à-dire sur l'inlining `NEXT_PUBLIC_*` habituel.
 *
 * https://nextjs.org/docs/app/guides/environment-variables#runtime-environment-variables
 */

/**
 * Nom de la variable globale portant la configuration côté navigateur.
 * Doit rester synchronisé avec la déclaration `Window` plus bas (une interface
 * TypeScript n'accepte pas de nom de propriété calculé).
 */
export const PUBLIC_ENV_GLOBAL = '__TET_PUBLIC_ENV__';

/**
 * Seules ces clés sont sérialisées dans le HTML : tout ajout ici devient
 * visible par le navigateur. Ne jamais y mettre de secret.
 */
export const PUBLIC_ENV_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'BACKEND_URL',
  'APP_URL',
  'SITE_URL',
  'SENTRY_DSN',
  'CRISP_WEBSITE_ID',
  'ENV_NAME',
  'APPLICATION_VERSION',
  'GIT_SHORT_HASH',
  'GIT_COMMIT_TIMESTAMP',
  'LOG_ACTION_DURATION',
] as const;

export type PublicEnvKey = (typeof PUBLIC_ENV_KEYS)[number];
export type PublicEnv = Partial<Record<PublicEnvKey, string>>;

declare global {
  interface Window {
    __TET_PUBLIC_ENV__?: PublicEnv;
  }
}

/**
 * Lit la configuration dans l'environnement du process. Réservé au serveur :
 * appelé par le script d'injection et par `getPublicEnv` hors navigateur.
 *
 * Le repli sur `NEXT_PUBLIC_<KEY>` couvre les conteneurs qui reçoivent encore
 * les anciens noms au runtime.
 */
export function readPublicEnvFromProcess(): PublicEnv {
  const env: PublicEnv = {};

  for (const key of PUBLIC_ENV_KEYS) {
    // Indexation dynamique volontaire : `process.env.FOO` serait remplacé par
    // sa valeur de build, `process.env[key]` non.
    const value = process.env[key] ?? process.env[`NEXT_PUBLIC_${key}`];
    if (value) {
      env[key] = value;
    }
  }

  return env;
}

/**
 * Valeurs inlinées au build. Les `process.env.NEXT_PUBLIC_*` sont écrits
 * littéralement : c'est ce qui permet au bundler de les remplacer, et donc à
 * `site` de continuer à fonctionner sans injection au runtime.
 *
 * Indispensable côté *serveur* aussi : l'étage runner de apps/site/Dockerfile
 * ne reçoit aucune de ces variables, son code serveur
 * ne dispose donc que des valeurs inlinées. Pour apps/app, où plus aucune
 * NEXT_PUBLIC_* n'existe au build, cet objet est entièrement vide.
 */
const BUILD_TIME_FALLBACK: PublicEnv = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  CRISP_WEBSITE_ID: process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID,
  ENV_NAME: process.env.NEXT_PUBLIC_ENV_NAME,
  APPLICATION_VERSION: process.env.NEXT_PUBLIC_APPLICATION_VERSION,
  GIT_SHORT_HASH: process.env.NEXT_PUBLIC_GIT_SHORT_HASH,
  GIT_COMMIT_TIMESTAMP: process.env.NEXT_PUBLIC_GIT_COMMIT_TIMESTAMP,
  LOG_ACTION_DURATION: process.env.NEXT_PUBLIC_LOG_ACTION_DURATION,
};

// L'environnement ne change pas pendant la vie du process (serveur) ni de la
// page (navigateur) : on ne recompose l'objet qu'une fois.
let cache: PublicEnv | undefined;

/**
 * Point d'accès isomorphe à la configuration publique.
 */
export function getPublicEnv(): PublicEnv {
  if (cache) {
    return cache;
  }

  cache =
    typeof window === 'undefined'
      ? { ...BUILD_TIME_FALLBACK, ...readPublicEnvFromProcess() }
      : { ...BUILD_TIME_FALLBACK, ...window[PUBLIC_ENV_GLOBAL] };

  return cache;
}
