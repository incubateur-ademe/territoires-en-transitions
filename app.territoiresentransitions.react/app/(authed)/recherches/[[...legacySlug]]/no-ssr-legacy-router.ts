'use client';

import dynamic from 'next/dynamic';

export const NoSsrLegacyRouter = dynamic(() => import('./legacy-router'), {
  ssr: false,
});
