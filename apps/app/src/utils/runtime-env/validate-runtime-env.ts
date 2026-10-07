import { getPublicEnv } from '@tet/api/public-env';
import { z } from 'zod';

/**
 * L'inlining `NEXT_PUBLIC_*` faisait office de filet : une variable absente
 * cassait le build. Maintenant que la configuration arrive au démarrage du
 * conteneur, ce filet a disparu — sans contrôle explicite, une variable oubliée
 * se traduirait par un `undefined` silencieux dans le navigateur.
 *
 * Appelé depuis `instrumentation.ts`, donc au démarrage du serveur (jamais
 * pendant `next build`).
 */
const runtimeEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  BACKEND_URL: z.string().url(),
  APP_URL: z.string().url(),
  ENV_NAME: z.string().min(1),
});

export function validateRuntimeEnv(): void {
  const result = runtimeEnvSchema.safeParse(getPublicEnv());

  if (result.success) {
    return;
  }

  const details = result.error.issues
    .map((issue) => `  - ${issue.path.join('.')} : ${issue.message}`)
    .join('\n');

  throw new Error(
    `Configuration runtime invalide — le conteneur doit recevoir ces variables ` +
      `d'environnement au déploiement :\n${details}`
  );
}
