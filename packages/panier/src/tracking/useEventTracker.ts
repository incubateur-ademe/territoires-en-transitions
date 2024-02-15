import {PageName, TrackingPlan} from 'src/tracking/trackingPlan';
import {usePostHog} from 'posthog-js/react';

/**
 * Le tracker d'événement d'une page.
 *
 * le typage permet de respecter le plan de tracking.
 */
type PageEventTracker =
  <
    E extends TrackingPlan[PageName]['events'],
    P extends TrackingPlan[PageName]['properties'],
    K extends string & keyof TrackingPlan[PageName]['events']
  >(
    event: K,
    properties: E[K] & P,
  ) => Promise<void>

/**
 * Renvoi le tracker pour enregistrer les évenements d'une page
 *
 * @param pageName le pathname de la page
 * @param onglet l'onglet à partir duquel les événements sont émis
 */
export function useEventTracker(
  pageName: PageName,
  onglet?: TrackingPlan[PageName]['onglets'],
): PageEventTracker {
  const posthog = usePostHog();

  return async (event, properties) => {
    if (posthog) {
      posthog.capture(
        event,
        {
          '$current_url': pageName,
          onglet: onglet,
          ...properties,
        },
      );
    } else {
      console.error(`PostHog is not ready.`);
    }
  };
}
