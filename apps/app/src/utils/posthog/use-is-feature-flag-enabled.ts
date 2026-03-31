import { ENV } from '@tet/api/environmentVariables';
import { createEnumObject } from '@tet/domain/utils';
import { useFeatureFlagEnabled } from 'posthog-js/react';

const FEATURE_FLAGS = [
  'is-referentiel-te-enabled',
  'is-widget-communs-enabled',
  'is-notification-enabled',
  'is-share-fiche-enabled',
  'is-access-edition-fiches-indicateurs-enabled',
] as const;

export const FeatureFlagEnum = createEnumObject(FEATURE_FLAGS);

type FeatureFlagKey = (typeof FEATURE_FLAGS)[number];

export function useIsFeatureFlagEnabled(featureFlagKey: FeatureFlagKey) {
  return (
    useFeatureFlagEnabled(featureFlagKey) ||
    ENV.application_env === 'dev' ||
    ENV.application_env === 'ci'
  );
}
