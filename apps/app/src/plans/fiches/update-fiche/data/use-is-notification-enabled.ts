import { useFeatureFlagEnabled } from 'posthog-js/react';

export function useIsNotificationEnabled() {
  return useFeatureFlagEnabled('is-notification-enabled');
}
