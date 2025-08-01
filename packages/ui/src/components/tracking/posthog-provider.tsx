'use client';

import posthog, { PostHog } from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { ReactNode, useEffect } from 'react';
import { getConsent } from './Consent';
import { PostHogPageView } from './posthog-pageview';

/**
 * Encapsule le client de tracking dans un provider react
 */
export const PostHogProvider = ({
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
      // Disable automatic pageview capture, as we capture manually
      capture_pageview: false,
      capture_pageleave: true,

      integrations: {
        crispChat: true,
        intercom: false,
      },

      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug();
      },
    });

    onClientInit?.(posthog);
  }, [host, key]);

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  );
};
