'use client';

import posthog, { PostHog } from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { ReactNode, useEffect } from 'react';
import { getConsent } from './Consent';

/**
 * Encapsule le client de tracking dans un provider react
 */
export const TrackingProvider = ({
  config: { host, key },
  onClientInit,
  children,
}: {
  config: { host?: string; key?: string };
  onClientInit?: (client: PostHog) => void;
  children: ReactNode;
}) => {
  useEffect(() => {
    posthog.init(key ?? '', {
      api_host: host ?? '/ingest',
      ui_host: 'https://eu.posthog.com',
      // create profiles for authenticated users only
      person_profiles: 'identified_only',
      persistence: getConsent() ? 'localStorage+cookie' : 'memory',
      capture_pageview: false, // on utilise PostHogPageView pour capturer les `page views`

      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug();
      },
    });

    onClientInit?.(posthog);
  }, [host, key]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
};
