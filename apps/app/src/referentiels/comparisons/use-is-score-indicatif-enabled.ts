import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';

export function useIsScoreIndicatifEnabled() {
  return useIsFeatureFlagEnabled('is-score-indicatif-enabled');
}
