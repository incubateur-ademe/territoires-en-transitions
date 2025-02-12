'use client';

import { ENV } from '@/api/environmentVariables';
import posthog, { PostHog } from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { ReactNode, useEffect } from 'react';
import { getConsent } from './Consent';

/**
 * Encapsule le client de tracking dans un provider react
 */
export const TrackingProvider = ({
  onClientInit,
  children,
}: {
  onClientInit?: (client: PostHog) => void;
  children: ReactNode;
}) => {
  useEffect(() => {
    // en mode dev, on envoie les données à PostHog, sinon on passe par le `rewrites` de `next.config.mjs`
    const apiHost =
      process.env.NODE_ENV !== 'production'
        ? ENV.posthog.host
        : `${window.location.origin}/ingest`;

    posthog.init(ENV.posthog.key as string, {
      api_host: apiHost,
      ui_host: ENV.posthog.host,
      // create profiles for authenticated users only
      person_profiles: 'identified_only',
      persistence: getConsent() ? 'cookie' : 'memory',
      capture_pageview: false, // on utilise PostHogPageView pour capturer les `page views`

      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug();
      },
    });

    onClientInit?.(posthog);
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
};
