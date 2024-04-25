import posthog, {PostHog} from 'posthog-js';
import {PostHogProvider} from 'posthog-js/react';

/**
 * Renvoi les vars d'env. pour le tracking depuis un module next js
 */
export const getNextTrackingEnv = () => {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const env = process.env.NODE_ENV;

  return {host, key, env};
};

/**
 * Crée le client de tracking
 */
export const createTrackingClient = ({
  host,
  key,
  env,
}: {
  host?: string;
  key?: string;
  env?: string;
}) => {
  const is_dev = env === 'development';

  if (!key || !host) {
    console.warn(
      `Le tracking PostHog n'est pas configuré, les variables d'env sont absentes.`
    );
    return;
  }

  // en mode dev, on envoie les données à PostHog, sinon on passe par le `rewrites` de `next.config.mjs`
  const apiHost = is_dev ? host : `${window.location.origin}/ingest`;

  posthog.init(key, {
    api_host: apiHost,
    ui_host: host,
    capture_pageview: false, // on utilise PostHogPageView pour capturer les `page views`

    loaded: posthog => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
  });

  return posthog;
};

/**
 * Encapsule le client de tracking dans un provider react
 */
export const TrackingProvider = ({
  children,
  client,
}: {
  children: React.ReactNode;
  client: PostHog;
}) => {
  return typeof window !== 'undefined' ? (
    <PostHogProvider client={client}>{children}</PostHogProvider>
  ) : (
    children
  );
};
