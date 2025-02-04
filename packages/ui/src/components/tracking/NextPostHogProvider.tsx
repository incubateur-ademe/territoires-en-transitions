'use client';

import { getConsent } from '@/ui/components/tracking/Consent';
import NextPostHogPageView from '@/ui/components/tracking/NextPostHogPageView';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const env = process.env.NODE_ENV;

export const NextPostHogProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useEffect(() => {
    if (!key || !host) {
      console.warn(
        `Le tracking PostHog n'est pas configuré, les variables d'env sont absentes.`
      );
    } else {
      posthog.init(key, {
        api_host: host,
        capture_pageview: false,
        // create profiles for authenticated users only
        person_profiles: 'identified_only',
        persistence: getConsent() ? 'cookie' : 'memory',
        loaded: (posthog) => {
          if (env === 'development') posthog.debug();
        },
      });
    }
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <NextPostHogPageView />
      {children}
    </PostHogProvider>
  );
};
