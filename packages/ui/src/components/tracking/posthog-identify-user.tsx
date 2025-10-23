'use client';

import { useSubscribeToUserAuthEvents } from '@/api/users/user-context/use-subscribe-to-user-auth-events';
import posthog from 'posthog-js';

export const PostHogIdentifyUser = () => {
  useSubscribeToUserAuthEvents({
    onSignIn: (user) => {
      posthog.identify(user.id, {
        email: user.email,
        user_id: user.id,
      });
    },
    onSignOut: () => {
      posthog.reset();
    },
  });

  return null;
};
