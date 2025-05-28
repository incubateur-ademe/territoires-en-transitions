'use client';

import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { Suspense, useEffect } from 'react';
import { objectToSnake } from 'ts-case-convert';
import { useGetDefaultEventProperties } from './use-get-default-event-properties';

/**
 * Documentation :
 * https://posthog.com/docs/libraries/next-js#capturing-pageviews
 */

function PageView({ properties }: { properties?: Record<string, unknown> }) {
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  const eventProperties = {
    ...useGetDefaultEventProperties(),
    ...properties,
  };

  // Track pageviews
  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }

      if (eventProperties.collectiviteId) {
        posthog.group(
          'collectivite',
          eventProperties.collectiviteId.toString()
        );
      }

      posthog.capture('$pageview', {
        $current_url: url,
        // PostHog recommends to use snake_case for event properties
        // https://posthog.com/docs/product-analytics/best-practices#suggested-naming-guide
        ...objectToSnake(eventProperties),
      });
    }
  }, [pathname, params, searchParams, posthog]);

  return null;
}

// Wrap this in Suspense to avoid the `useSearchParams` usage above
// from de-opting the whole app into client-side rendering
// See: https://nextjs.org/docs/messages/deopted-into-client-rendering
export function PostHogPageView({
  properties,
}: {
  properties?: Record<string, unknown>;
}) {
  return (
    <Suspense fallback={null}>
      <PageView properties={properties} />
    </Suspense>
  );
}
