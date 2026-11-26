import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';

export function useIsIndicateursObjectifsEnabled(): boolean {
  return (
    useIsFeatureFlagEnabled('is-plan-suivi-indicateurs-objectifs-enabled') ??
    false
  );
}
