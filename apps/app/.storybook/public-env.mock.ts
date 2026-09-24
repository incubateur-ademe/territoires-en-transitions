import { PUBLIC_ENV_GLOBAL } from '@tet/api/public-env';

/**
 * Storybook n'a pas de serveur Next pour injecter la configuration runtime :
 * `app/public-env.script.tsx` ne s'exécute jamais ici, et le repli build-time
 * de `getPublicEnv` est vide (les variables du `.env` n'ont plus le préfixe
 * `NEXT_PUBLIC_`, donc plus rien ne les inline).
 *
 * On pose donc le global nous-mêmes, avec des valeurs inertes : aucune story ne
 * doit atteindre un vrai backend, mais les providers (Supabase, tRPC) exigent
 * des valeurs non vides pour s'instancier.
 *
 * À importer **en premier** dans `preview.tsx` : `getPublicEnv` mémoïse son
 * résultat au premier accès.
 */
window[PUBLIC_ENV_GLOBAL] = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: 'storybook',
  BACKEND_URL: 'http://127.0.0.1:8080',
  APP_URL: 'http://127.0.0.1:3000',
  SITE_URL: 'https://www.territoiresentransitions.fr',
  ENV_NAME: 'storybook',
};
