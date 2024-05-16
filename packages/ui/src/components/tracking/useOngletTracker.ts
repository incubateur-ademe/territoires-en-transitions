import {usePostHog} from 'posthog-js/react';
import {PageName, PageProperties, TrackingPlan} from './trackingPlan';

/**
 * Le tracker les changements d'onglet d'une page.
 *
 * le typage permet de respecter le plan de tracking.
 */
type PageOngletTracker<N extends PageName> = (
  onglet: TrackingPlan[N]['onglets'],
  properties?: PageProperties<N>
) => Promise<void>;

/**
 * Renvoi le tracker pour enregistrer les évenements d'une page
 *
 * @param pageName le pathname de la page
 */
export function useOngletTracker<N extends PageName>(
  pageName: N
): PageOngletTracker<N> {
  const posthog = usePostHog();

  return async (onglet, properties = undefined) => {
    if (posthog) {
      posthog.capture('onglet', {
        $current_url: pageName,
        onglet: onglet,
        ...(properties ?? {}),
      });
    } else {
      console.error(`PostHog is not ready.`);
    }
  };
}
