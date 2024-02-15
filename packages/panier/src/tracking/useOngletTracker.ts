import {usePostHog} from 'posthog-js/react';
import {PageName, TrackingPlan} from 'src/tracking/trackingPlan';

/**
 * Le tracker les changements d'onglet d'une page.
 *
 * le typage permet de respecter le plan de tracking.
 */
type PageOngletTracker =
  <
    O extends string & TrackingPlan[PageName]['onglets'],
    P extends TrackingPlan[PageName]['properties'],
  >(
    onglet: O,
    properties: P,
  ) => Promise<void>

/**
 * Renvoi le tracker pour enregistrer les évenements d'une page
 *
 * @param pageName le pathname de la page
 */
export function useOngletTracker(
  pageName: PageName,
): PageOngletTracker {
  const posthog = usePostHog();

  return async (onglet, properties) => {
    if (posthog) {
      posthog.capture(
        'onglet',
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
