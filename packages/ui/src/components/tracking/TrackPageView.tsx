import {useEffect} from 'react';
import {usePostHog} from 'posthog-js/react';
import {PageName, TrackingPlan} from './trackingPlan';

/**
 * Type guard pour les propriétés
 */
function isRelativeToCollectivite(object: unknown): object is {
  collectivite_id?: number;
  collectivite_preset?: number;
} {
  return (
    typeof object === 'object' &&
    ('collectivite_id' in object || 'collectivite_preset' in object)
  );
}

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
      // Spécifie le groupe des évenements qui suivent cet appel
      // https://posthog.com/docs/getting-started/group-analytics
      posthog.group(
        'collectivite',
        isRelativeToCollectivite(properties)
          ? `${properties.collectivite_id ?? properties.collectivite_preset}`
          : null
      );

      // Envoie la pageview manuellement à PostHog conformément au tracking plan
      posthog.capture('$pageview', {
        $current_url: pageName,
        ...(properties ?? {}),
      });
    }
  }, [posthog, pageName]);

  return null;
}
