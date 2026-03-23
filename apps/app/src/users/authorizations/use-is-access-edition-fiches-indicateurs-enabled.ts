import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';

export function useIsAccessEditionFichesIndicateursEnabled() {
  return useIsFeatureFlagEnabled('is-access-edition-fiches-indicateurs-enabled');
}
