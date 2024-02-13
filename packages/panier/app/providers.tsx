'use client';

import posthog from 'posthog-js';
import {PostHogProvider} from 'posthog-js/react';

if (typeof window !== 'undefined') {
  const is_dev = process.env.NODE_ENV === 'development';
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (is_dev && (!key || !host)) {
    console.warn(`Le tracking PostHog n'est pas configuré, les variables d'env sont absentes.`);
  } else {
    if (!key) throw `La variable NEXT_PUBLIC_POSTHOG_KEY n'est pas définie`;
    if (!host) throw `La variable NEXT_PUBLIC_POSTHOG_HOST n'est pas définie`;

    // en mode dev, on envoie les données à PostHog, sinon on passe par le `rewrites` de `next.config.mjs`
    const apiHost = is_dev ? host : `${window.location.origin}/ingest`;

    posthog.init(key, {
      api_host: apiHost,
      ui_host: host,
      capture_pageview: false, // on utilise PostHogPageView pour capturer les `page views`

      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug();
      },
    });
  }
}

export function PHProvider({children}: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
