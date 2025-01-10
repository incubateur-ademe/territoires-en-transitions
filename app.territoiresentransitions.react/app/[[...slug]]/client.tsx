'use client';

import dynamic from 'next/dynamic';

const LegacyRouter = dynamic(() => import('../../src/legacy-router'), {
  ssr: false,
});

export function ClientOnly() {
  return <LegacyRouter />;
}
