'use client';

import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { Suspense, useEffect } from 'react';
import { objectToSnake } from 'ts-case-convert';

/**
 * Documentation :
 * https://posthog.com/docs/libraries/next-js#capturing-pageviews
 */

function PageView() {
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  // Track pageviews
  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }

      if (params.collectiviteId) {
        posthog.group('collectivite', params.collectiviteId as string);
      }

      posthog.capture('$pageview', {
        $current_url: url,
        // PostHog recommends to use snake_case for event properties
        // https://posthog.com/docs/product-analytics/best-practices#suggested-naming-guide
        ...objectToSnake(params ?? {}),
      });
    }
  }, [pathname, params, searchParams, posthog]);

  return null;
}

// Wrap this in Suspense to avoid the `useSearchParams` usage above
// from de-opting the whole app into client-side rendering
// See: https://nextjs.org/docs/messages/deopted-into-client-rendering
export function PostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PageView />
    </Suspense>
  );
}
