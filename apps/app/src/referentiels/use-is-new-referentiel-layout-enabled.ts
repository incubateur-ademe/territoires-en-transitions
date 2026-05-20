import { useFeatureFlagEnabled } from 'posthog-js/react';

/**
 * Contrairement aux autres flags consommés via `useIsFeatureFlagEnabled`, ce
 * flag n'est volontairement PAS forcé à `true` en dev/CI : l'activer redirige
 * toute la page référentiel vers le nouveau layout, ce qui casserait les tests
 * e2e ciblant l'ancienne route.
 */
export function useIsNewReferentielLayoutEnabled(): boolean {
  return useFeatureFlagEnabled('is-new-referentiel-layout-enabled') ?? false;
}
