'use client';

import dynamic from 'next/dynamic';

const LegacyRouter = dynamic(() => import('./legacy-router'), {
  ssr: false,
});

// TODO-NEXTJS: Replace BrowserRouter with NextRouter
export default function Page() {
  return <LegacyRouter />;
}
