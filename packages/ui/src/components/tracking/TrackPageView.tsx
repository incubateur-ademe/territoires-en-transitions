import {useEffect} from 'react';
import {usePostHog} from 'posthog-js/react';
import {PageName, TrackingPlan} from './trackingPlan';

/**
 * Les props du tracker de pageviews
 *
 * le typage permet de respecter le plan de tracking.
 */

type TrackPageViewProps<N extends PageName> = {
  pageName: N;
} & (TrackingPlan[N]['properties'] extends object
  ? {properties: TrackingPlan[N]['properties']}
  : {properties?: undefined});

/**
 * Envoi une page view à PostHog lors du rendering.
 *
 * Note : en dev quand le mode strict est activé,
 * on envoie deux événements à la suite.
 * https://react.dev/reference/react/StrictMode
 *
 * @param pageName Le nom de la page
 * @param properties Les propriétés obligatoires de la page
 * @constructor
 */
export function TrackPageView<N extends PageName>({
  pageName,
  properties,
}: TrackPageViewProps<N>): null {
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog) {
      posthog.capture('$pageview', {
        $current_url: pageName,
        ...(properties ?? {}),
      });
    }
  }, [posthog, pageName]);

  return null;
}
