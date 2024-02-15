'use client';

import {useEffect} from 'react';
import {usePostHog} from 'posthog-js/react';
import {PageName} from 'src/tracking/trackingPlan';

/**
 * Envoi une page view à PostHog lors du rendering.
 *
 * Note : en dev quand le mode strict est activé,
 * on envoie deux événementsà la suite.
 * https://react.dev/reference/react/StrictMode
 *
 * @param pageName
 * @constructor
 */
export default function TrackPageView({pageName}: {
  pageName: PageName
}): null {
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog) {
      posthog.capture(
        '$pageview',
        {
          '$current_url': pageName,
        },
      );
    }
  }, [posthog, pageName]);

  return null;
}
