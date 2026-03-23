import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';

export function useShareFicheEnabled() {
  return useIsFeatureFlagEnabled('is-share-fiche-enabled');
}
