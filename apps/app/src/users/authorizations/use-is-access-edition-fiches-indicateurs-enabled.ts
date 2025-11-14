import { useFeatureFlagEnabled } from 'posthog-js/react';

export function useIsAccessEditionFichesIndicateursEnabled() {
  return useFeatureFlagEnabled('is-access-edition-fiches-indicateurs-enabled');
}
