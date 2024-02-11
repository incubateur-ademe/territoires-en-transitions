'use client';

import posthog from 'posthog-js';
import {PostHogProvider} from 'posthog-js/react';

if (typeof window !== 'undefined') {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY!;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST!;
  const apiHost = process.env.NODE_ENV === 'development' ? host :`${window.location.origin}/ingest`;
  posthog.init(key, {
    api_host: apiHost,
    ui_host: host,
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug()
    }
  });
}

export function PHProvider({children}: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
