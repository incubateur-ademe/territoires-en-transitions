import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';

export function useIsNotificationEnabled() {
  return useIsFeatureFlagEnabled('is-notification-enabled');
}
