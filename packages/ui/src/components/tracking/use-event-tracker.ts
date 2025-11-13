import { usePostHog } from 'posthog-js/react';
import { objectToSnake } from 'ts-case-convert';
import { EventName } from './posthog-events';
import { useGetDefaultEventProperties } from './use-get-default-event-properties';

/**
 * Renvoie une fonction pour enregistrer des évenements de tracking PostHog.
 */
export function useEventTracker() {
  const posthog = usePostHog();
  const defaultProperties = useGetDefaultEventProperties();

  return (event: EventName, properties?: Record<string, unknown>) => {
    posthog.capture(
      event,
      // PostHog recommends to use snake_case for event properties
      // https://posthog.com/docs/product-analytics/best-practices#suggested-naming-guide
      objectToSnake({
        ...defaultProperties,
        ...(properties ?? {}),
      })
    );
  };
}
