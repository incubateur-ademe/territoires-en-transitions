'use client';

import { CrispWidgetLazyLoad } from '@/app/lib/crisp.widget.lazy-load';
import dynamic from 'next/dynamic';

const Datadog = dynamic(() => import('../src/lib/datadog.init'), {
  ssr: false,
});

export default function ThirdPartyProviders() {
  return (
    <>
      <CrispWidgetLazyLoad />
      <Datadog />
    </>
  );
}
