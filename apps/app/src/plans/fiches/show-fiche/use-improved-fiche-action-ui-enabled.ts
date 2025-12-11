import { useFeatureFlagEnabled } from 'posthog-js/react';

/**
 * Hook to check if the improved fiche action UI feature flag is enabled.
 * Feature flag key: 'is-improved-fiche-action-ui-enabled'
 *
 * This flag controls whether users see the new, improved fiche action UI
 * or the legacy version.
 */
export function useImprovedFicheActionUiEnabled() {
  return useFeatureFlagEnabled('is-improved-fiche-action-ui-enabled');
}
