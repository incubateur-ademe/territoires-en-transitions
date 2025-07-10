import { useFeatureFlagEnabled } from 'posthog-js/react';

export function useIsScoreIndicatifEnabled() {
  return useFeatureFlagEnabled('is-score-indicatif-enabled');
}
