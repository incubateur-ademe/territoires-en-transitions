import {useEffect} from 'react';
import {usePostHog} from 'posthog-js/react';

type Props = {
  pageName: string;
};

/**
 * Envoi une page view à PostHog
 * A utiliser lorsque les pages ne sont pas configurées
 * dans le tracking plan
 */
export const TrackUnplannedPageView = ({pageName}: Props) => {
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog) {
      // Envoie la pageview à PostHog
      posthog.capture('$pageview', {
        $current_url: pageName,
      });
    }
  }, [posthog, pageName]);

  return null;
};
