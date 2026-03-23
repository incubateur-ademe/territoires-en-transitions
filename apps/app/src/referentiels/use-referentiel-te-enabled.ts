import { useIsFeatureFlagEnabled } from '../utils/posthog/use-is-feature-flag-enabled';

export function useReferentielTeEnabled() {
  return useIsFeatureFlagEnabled('is-referentiel-te-enabled');
}
