import { useFeatureFlagEnabled } from 'posthog-js/react';

export function useIsFicheRightsManagementEnabled() {
  return useFeatureFlagEnabled('is-fiche-rights-management-enabled');
}
