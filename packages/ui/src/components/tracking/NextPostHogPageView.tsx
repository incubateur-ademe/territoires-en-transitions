'use client';

import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { Suspense, useEffect } from 'react';

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

      posthog.capture('$pageview', { $current_url: url, ...params });
    }
  }, [pathname, params, searchParams, posthog]);

  return null;
}

// Wrap this in Suspense to avoid the `useSearchParams` usage above
// from de-opting the whole app into client-side rendering
// See: https://nextjs.org/docs/messages/deopted-into-client-rendering
export default function NextPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PageView />
    </Suspense>
  );
}
