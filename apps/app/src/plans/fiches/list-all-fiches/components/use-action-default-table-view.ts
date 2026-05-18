import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';

export function useActionDefaultTableViewEnabled() {
  return useIsFeatureFlagEnabled('is-action-default-table-view-enabled');
}
