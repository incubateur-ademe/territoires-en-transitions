import { useFeatureFlagEnabled } from 'posthog-js/react';

export function useShareFicheEnabled() {
  return useFeatureFlagEnabled('is-share-fiche-enabled');
}
