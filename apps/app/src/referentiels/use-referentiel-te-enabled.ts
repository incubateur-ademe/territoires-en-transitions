import { ENV } from '@tet/api/environmentVariables';
import { useFeatureFlagEnabled } from 'posthog-js/react';

export function useReferentielTeEnabled() {
  return (
    useFeatureFlagEnabled('is-referentiel-te-enabled') ||
    !ENV.application_env ||
    ENV.application_env === 'ci'
  );
}
