'use client';

import { ENV } from '@/api/environmentVariables';
import posthog, { PostHog } from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { ReactNode, useEffect } from 'react';
import { getConsent } from './Consent';

/**
 * Crée le client de tracking
 */
const createTrackingClient = ({
  host,
  key,
  env,
}: {
  host?: string;
  key?: string;
  env?: string;
}) => {
  if (typeof window === 'undefined') {
    return posthog;
  }

  const is_dev = env === 'development';

  if (!key || !host) {
    console.warn(
      `Le tracking PostHog n'est pas configuré, les variables d'env sont absentes.`
    );
    return posthog;
  }

  // en mode dev, on envoie les données à PostHog, sinon on passe par le `rewrites` de `next.config.mjs`
  const apiHost = is_dev ? host : `${window.location.origin}/ingest`;

  posthog.init(key, {
    api_host: apiHost,
    ui_host: host,
    // create profiles for authenticated users only
    person_profiles: 'identified_only',
    persistence: getConsent() ? 'cookie' : 'memory',
    capture_pageview: false, // on utilise PostHogPageView pour capturer les `page views`

    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
  });

  return posthog;
};

const posthogClient = createTrackingClient(ENV.posthog);

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
    onClientInit?.(posthogClient);
  });

  return <PostHogProvider client={posthogClient}>{children}</PostHogProvider>;
};
