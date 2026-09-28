import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';

export function useIsScoreIndicateurEnabled(): boolean {
  return useIsFeatureFlagEnabled('is-score-indicateur-enabled');
}
