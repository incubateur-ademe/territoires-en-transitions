import { ENV } from '@tet/api/environmentVariables';
import { FeatureFlagKey } from '@tet/domain/utils';
import { useFeatureFlagEnabled } from 'posthog-js/react';

export function useIsFeatureFlagEnabled(featureFlagKey: FeatureFlagKey) {
  return (
    useFeatureFlagEnabled(featureFlagKey) ||
    ENV.application_env === 'dev' ||
    ENV.application_env === 'ci'
  );
}
