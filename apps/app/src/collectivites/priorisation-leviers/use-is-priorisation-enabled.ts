import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';

export function useIsPriorisationEnabled(): boolean {
  return useIsFeatureFlagEnabled('is-priorisation-enabled') ?? false;
}
