import { useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { PageName, PageProperties } from './trackingPlan';

// extrait l'id de la collectivité depuis l'objet donné si une des propriétés
// attendues est présente
const getCollectiviteId = (properties: unknown) => {
  if (!properties || typeof properties !== 'object') {
    return null;
  }

  if ('collectivite_id' in properties) {
    return `${properties.collectivite_id}`;
  }
  if ('collectivite_preset' in properties) {
    return `${properties.collectivite_preset}`;
  }
};

/**
 * Les props du tracker de pageviews
 *
 * le typage permet de respecter le plan de tracking.
 */
type TrackPageViewProps<N extends PageName> = {
  pageName: N;
} & (PageProperties<N> extends object
  ? { properties: PageProperties<N> }
  : { properties?: undefined });

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
      // Spécifie le groupe des évenements qui suivent cet appel
      // https://posthog.com/docs/getting-started/group-analytics
      posthog.group('collectivite', getCollectiviteId(properties) ?? '');

      // Envoie la pageview manuellement à PostHog conformément au tracking plan
      posthog.capture('$pageview', {
        $current_url: pageName,
        ...(properties ?? {}),
      });
    }
  }, [posthog, pageName]);

  return null;
}
