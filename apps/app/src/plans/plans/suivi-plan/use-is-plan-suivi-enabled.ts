import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';

export function useIsPlanSuiviEnabled(): boolean {
  return useIsFeatureFlagEnabled('is-plan-suivi-enabled') ?? false;
}
